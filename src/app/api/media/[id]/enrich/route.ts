import { NextRequest, NextResponse } from 'next/server';
import db from '@/db/client';
import { findBestTmdbMatch, getTmdbDetails, getTmdbExternalIds } from '@/lib/tmdb';
import { fetchByImdbId, fetchByTitle } from '@/lib/omdb';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

interface MediaRow {
  id: number;
  title: string;
  release_year: number;
  media_type: 'movie' | 'series' | 'anime';
}

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await _req.json().catch(() => ({})) as { tmdb_id?: number };

  const item = db.prepare('SELECT * FROM media WHERE id = ?').get(parseInt(id)) as MediaRow | undefined;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const tmdbType = item.media_type === 'movie' ? 'movie' : 'tv';

  // Use a pre-selected TMDB ID if provided, otherwise find the best match
  let tmdbId: number;
  let posterPath: string | null = null;
  if (body.tmdb_id) {
    tmdbId = body.tmdb_id;
  } else {
    const best = await findBestTmdbMatch(item.title, tmdbType, item.release_year);
    if (!best) return NextResponse.json({ error: 'No TMDB match found' }, { status: 404 });
    tmdbId = best.id;
    posterPath = best.poster_path ?? null;
  }

  // TMDB details
  const details = await getTmdbDetails(tmdbId, tmdbType);
  const externalIds = await getTmdbExternalIds(tmdbId, tmdbType);
  const imdbId = externalIds?.imdb_id ?? null;

  // OMDB for RT score
  let rtScore: string | null = null;
  if (imdbId) {
    const omdb = await fetchByImdbId(imdbId);
    rtScore = omdb?.rtScore ?? null;
  }
  if (!rtScore) {
    const omdb = await fetchByTitle(item.title, item.release_year);
    rtScore = omdb?.rtScore ?? null;
  }

  const genres = details?.genres?.map((g) => g.name) ?? [];
  const seasons = details?.seasons?.filter(s => s.season_number > 0 && s.vote_average > 0) ?? [];
  const finalPoster = details?.poster_path ?? posterPath;

  db.prepare(`
    UPDATE media SET
      tmdb_id = ?, tmdb_score = ?, tmdb_vote_count = ?,
      tmdb_overview = ?, tmdb_poster_path = ?, tmdb_genres = ?,
      tmdb_seasons = ?, imdb_id = ?, rt_score = ?,
      enriched_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(
    tmdbId,
    details?.vote_average ?? null,
    details?.vote_count ?? null,
    details?.overview ?? null,
    finalPoster ?? null,
    genres.length > 0 ? JSON.stringify(genres) : null,
    seasons.length > 0 ? JSON.stringify(seasons) : null,
    imdbId,
    rtScore,
    parseInt(id)
  );

  const updated = db.prepare('SELECT * FROM media WHERE id = ?').get(parseInt(id));
  return NextResponse.json(updated);
}
