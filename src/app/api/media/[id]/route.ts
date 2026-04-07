import { NextRequest, NextResponse } from 'next/server';
import db from '@/db/client';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const row = db.prepare('SELECT * FROM media WHERE id = ?').get(parseInt(id));
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json() as Partial<{
    title: string;
    release_year: number;
    personal_score: number | null;
    watched: number;
    sheet_year: number;
    media_type: string;
    season_number: number;
  }>;

  const existing = db.prepare('SELECT * FROM media WHERE id = ?').get(parseInt(id));
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const fields: string[] = [];
  const values: unknown[] = [];

  if (body.title !== undefined) { fields.push('title = ?'); values.push(body.title); }
  if (body.release_year !== undefined) { fields.push('release_year = ?'); values.push(body.release_year); }
  if ('personal_score' in body) {
    fields.push('personal_score = ?');
    values.push(body.personal_score ?? null);
    fields.push('watched = ?');
    values.push(body.personal_score != null ? 1 : 0);
  }
  if (body.watched !== undefined && !('personal_score' in body)) {
    fields.push('watched = ?');
    values.push(body.watched);
  }
  if (body.sheet_year !== undefined) { fields.push('sheet_year = ?'); values.push(body.sheet_year); }
  if (body.media_type !== undefined) { fields.push('media_type = ?'); values.push(body.media_type); }
  if (body.season_number !== undefined) { fields.push('season_number = ?'); values.push(body.season_number); }

  if (fields.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  fields.push("updated_at = datetime('now')");
  values.push(parseInt(id));

  db.prepare(`UPDATE media SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT * FROM media WHERE id = ?').get(parseInt(id));
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const existing = db.prepare('SELECT id FROM media WHERE id = ?').get(parseInt(id));
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  db.prepare('DELETE FROM media WHERE id = ?').run(parseInt(id));
  return NextResponse.json({ success: true });
}
