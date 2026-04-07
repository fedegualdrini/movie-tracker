import { NextRequest, NextResponse } from 'next/server';
import { searchTmdb, hasApiKey } from '@/lib/tmdb';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!hasApiKey()) {
    return NextResponse.json({ results: [], error: 'TMDB API key not configured' });
  }
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const type = (req.nextUrl.searchParams.get('type') ?? 'movie') as 'movie' | 'tv';
  if (!q) return NextResponse.json({ results: [] });
  const results = await searchTmdb(q, type);
  return NextResponse.json({ results });
}
