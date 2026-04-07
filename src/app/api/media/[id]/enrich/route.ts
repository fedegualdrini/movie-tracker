import { NextRequest, NextResponse } from 'next/server';
import db from '@/db/client';
import { searchTmdb, getTmdbDetails, getTmdbExternalIds } from '@/lib/tmdb';
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
  const item = db.prepare('SELECT * FROM media WHERE id = ?').get(parseInt(id)) as MediaRow | undefined;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const tmdbType = item.media_type === 'movie' ? 'movie' : 'tv';

  // TMDB search — try with year first (precise), fall back without year (handles
  // series where release_year is a later season but TMDB uses the original air date)
  let results = await searchTmdb(item.title, tmdbType, item.release_year);
  if (results.length === 0) results = await searchTmdb(item.title, tmdbType);
  const best = results[0];
  if (!best) {
    return NextResponse.json({ error: 'No TMDB match found' }, { status: 404 });
  }

  // TMDB details
  const details = await getTmdbDetails(best.id, tmdbType);
  const externalIds = await getTmdbExternalIds(best.id, tmdbType);
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

  db.prepare(`
    UPDATE media SET
      tmdb_id = ?, tmdb_score = ?, tmdb_vote_count = ?,
      tmdb_overview = ?, tmdb_poster_path = ?, tmdb_genres = ?,
      imdb_id = ?, rt_score = ?,
      enriched_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(
    best.id,
    details?.vote_average ?? null,
    details?.vote_count ?? null,
    details?.overview ?? null,
    best.poster_path ?? null,
    genres.length > 0 ? JSON.stringify(genres) : null,
    imdbId,
    rtScore,
    parseInt(id)
  );

  const updated = db.prepare('SELECT * FROM media WHERE id = ?').get(parseInt(id));
  return NextResponse.json(updated);
}
