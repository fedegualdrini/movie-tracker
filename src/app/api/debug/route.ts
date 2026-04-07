import { NextResponse } from 'next/server';
import { searchTmdb } from '@/lib/tmdb';

export const runtime = 'nodejs';

export async function GET() {
  const key = process.env.TMDB_API_KEY ?? null;

  // 1. Raw fetch — bypasses lib/tmdb.ts
  let rawStatus: number | null = null;
  let rawResultCount: number | null = null;
  let rawError: string | null = null;
  try {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=The+Creator`;
    const res = await fetch(url, { cache: 'no-store' });
    rawStatus = res.status;
    const body = await res.json() as { results?: unknown[] };
    rawResultCount = body.results?.length ?? 0;
  } catch (err) {
    rawError = String(err);
  }

  // 2. searchTmdb() — same code path as enrich-all
  let tmdbResults: unknown = null;
  let tmdbError: string | null = null;
  try {
    tmdbResults = await searchTmdb('The Creator', 'movie', 2023);
  } catch (err) {
    tmdbError = String(err);
  }

  // 3. searchTmdb() without year — the fallback path
  let tmdbResultsNoYear: unknown = null;
  let tmdbErrorNoYear: string | null = null;
  try {
    tmdbResultsNoYear = await searchTmdb('The Creator', 'movie');
  } catch (err) {
    tmdbErrorNoYear = String(err);
  }

  return NextResponse.json({
    env: {
      TMDB_API_KEY_set: Boolean(key),
      TMDB_API_KEY_prefix: key?.slice(0, 8) ?? null,
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PHASE: process.env.NEXT_PHASE ?? null,
    },
    raw_fetch: { status: rawStatus, result_count: rawResultCount, error: rawError },
    searchTmdb_with_year: { result_count: Array.isArray(tmdbResults) ? tmdbResults.length : null, first_title: Array.isArray(tmdbResults) && tmdbResults.length > 0 ? (tmdbResults[0] as { title?: string }).title : null, error: tmdbError },
    searchTmdb_no_year: { result_count: Array.isArray(tmdbResultsNoYear) ? tmdbResultsNoYear.length : null, first_title: Array.isArray(tmdbResultsNoYear) && tmdbResultsNoYear.length > 0 ? (tmdbResultsNoYear[0] as { title?: string }).title : null, error: tmdbErrorNoYear },
  });
}
