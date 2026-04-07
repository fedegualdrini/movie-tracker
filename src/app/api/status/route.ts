import { NextResponse } from 'next/server';
import db from '@/db/client';

export const runtime = 'nodejs';

export async function GET() {
  const counts = db.prepare(`
    SELECT media_type, sheet_year, COUNT(*) as count, SUM(watched) as watched
    FROM media GROUP BY media_type, sheet_year ORDER BY sheet_year DESC, media_type
  `).all();

  return NextResponse.json({
    tmdbKey: Boolean(process.env.TMDB_API_KEY),
    omdbKey: Boolean(process.env.OMDB_API_KEY),
    counts,
  });
}
