import { NextResponse } from 'next/server';
import db from '@/db/client';
import { findBestTmdbMatch, getTmdbDetails, getTmdbExternalIds } from '@/lib/tmdb';
import { fetchByImdbId, fetchByTitle } from '@/lib/omdb';

export const runtime = 'nodejs';

// How long to wait between items to respect TMDB rate limits (40 req/10s)
// Each item uses ~3 TMDB requests + 1 OMDB request, so 250ms gap is safe
const DELAY_MS = 300;

interface MediaRow {
  id: number;
  title: string;
  release_year: number;
  media_type: 'movie' | 'series' | 'anime';
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST() {
  const items = db.prepare(
    "SELECT id, title, release_year, media_type FROM media WHERE enriched_at IS NULL ORDER BY sheet_year DESC, id"
  ).all() as MediaRow[];

  const total = items.length;

  // Use Server-Sent Events to stream progress back to the client
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      send({ type: 'start', total });

      let done = 0;
      let failed = 0;

      for (const item of items) {
        try {
          const tmdbType = item.media_type === 'movie' ? 'movie' : 'tv';
          const best = await findBestTmdbMatch(item.title, tmdbType, item.release_year);

          if (!best) {
            failed++;
            send({ type: 'skip', id: item.id, title: item.title, reason: 'No TMDB match', done: ++done, total, failed });
            await delay(DELAY_MS);
            continue;
          }

          const [details, externalIds] = await Promise.all([
            getTmdbDetails(best.id, tmdbType),
            getTmdbExternalIds(best.id, tmdbType),
          ]);

          const imdbId = externalIds?.imdb_id ?? null;
          let rtScore: string | null = null;

          if (imdbId) {
            const omdb = await fetchByImdbId(imdbId);
            rtScore = omdb?.rtScore ?? null;
          }
          if (!rtScore) {
            const omdb = await fetchByTitle(item.title, item.release_year);
            rtScore = omdb?.rtScore ?? null;
          }

          const genres = details?.genres?.map((g: { name: string }) => g.name) ?? [];
          const seasons = details?.seasons?.filter((s: { season_number: number; vote_average: number }) => s.season_number > 0 && s.vote_average > 0) ?? [];

          db.prepare(`
            UPDATE media SET
              tmdb_id = ?, tmdb_score = ?, tmdb_vote_count = ?,
              tmdb_overview = ?, tmdb_poster_path = ?, tmdb_genres = ?,
              tmdb_seasons = ?, imdb_id = ?, rt_score = ?,
              enriched_at = datetime('now'), updated_at = datetime('now')
            WHERE id = ?
          `).run(
            best.id,
            details?.vote_average ?? null,
            details?.vote_count ?? null,
            details?.overview ?? null,
            best.poster_path ?? null,
            genres.length > 0 ? JSON.stringify(genres) : null,
            seasons.length > 0 ? JSON.stringify(seasons) : null,
            imdbId,
            rtScore,
            item.id
          );

          send({
            type: 'enriched',
            id: item.id,
            title: item.title,
            poster: best.poster_path ?? null,
            tmdbScore: details?.vote_average ?? null,
            rtScore,
            done: ++done,
            total,
            failed,
          });
        } catch (err) {
          failed++;
          send({ type: 'error', id: item.id, title: item.title, error: String(err), done: ++done, total, failed });
        }

        await delay(DELAY_MS);
      }

      send({ type: 'complete', done, total, failed });
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
