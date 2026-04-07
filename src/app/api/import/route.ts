import { NextRequest, NextResponse } from 'next/server';
import db from '@/db/client';
import { importExcel } from '@/lib/excel-import';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { filePath?: string };
  const filePath = body.filePath
    ?? process.env.EXCEL_PATH
    ?? path.join(process.cwd(), '..', 'Downloads', 'Movies.xlsx');

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO media (title, release_year, media_type, sheet_year, personal_score, watched)
    VALUES (@title, @release_year, @media_type, @sheet_year, @personal_score, @watched)
  `);

  try {
    const result = importExcel(filePath, (entry) => {
      const info = stmt.run(entry);
      return info.changes > 0;
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
