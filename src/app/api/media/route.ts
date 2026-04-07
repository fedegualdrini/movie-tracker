import { NextRequest, NextResponse } from 'next/server';
import db from '@/db/client';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type') ?? 'all';
  const year = searchParams.get('year') ?? 'all';
  const watched = searchParams.get('watched') ?? 'all';
  const search = searchParams.get('search') ?? '';
  const sort = searchParams.get('sort') ?? 'title';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (type !== 'all') {
    conditions.push('media_type = ?');
    params.push(type);
  }
  if (year !== 'all') {
    conditions.push('sheet_year = ?');
    params.push(parseInt(year));
  }
  if (watched === 'true') {
    conditions.push('watched = 1');
  } else if (watched === 'false') {
    conditions.push('watched = 0');
  }
  if (search) {
    conditions.push('title LIKE ?');
    params.push(`%${search}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sortMap: Record<string, string> = {
    title: 'title ASC',
    score_desc: 'personal_score DESC NULLS LAST',
    score_asc: 'personal_score ASC NULLS LAST',
    year: 'release_year DESC',
    recent: 'sheet_year DESC, id DESC',
  };
  const orderBy = sortMap[sort] ?? 'title ASC';

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM media ${where}`).get(...params) as { cnt: number }).cnt;
  const items = db.prepare(`SELECT * FROM media ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`).all(...params, limit, offset);

  return NextResponse.json({ items, total, page, limit });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    title: string;
    release_year: number;
    media_type: 'movie' | 'series' | 'anime';
    sheet_year: number;
    season_number?: number;
    personal_score?: number | null;
  };

  const { title, release_year, media_type, sheet_year, personal_score } = body;
  const season_number = body.season_number ?? 1;
  if (!title || !release_year || !media_type || !sheet_year) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const watched = personal_score != null ? 1 : 0;

  try {
    const info = db.prepare(`
      INSERT INTO media (title, release_year, media_type, sheet_year, season_number, personal_score, watched)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, release_year, media_type, sheet_year, season_number, personal_score ?? null, watched);

    const row = db.prepare('SELECT * FROM media WHERE id = ?').get(info.lastInsertRowid);
    return NextResponse.json(row, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Entry already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
