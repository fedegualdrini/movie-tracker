import { NextRequest, NextResponse } from 'next/server';
import db from '@/db/client';
import { importExcel, importExcelFromBuffer } from '@/lib/excel-import';
import path from 'path';
import os from 'os';
import fs from 'fs';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') ?? '';
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO media (title, release_year, media_type, sheet_year, personal_score, watched)
    VALUES (@title, @release_year, @media_type, @sheet_year, @personal_score, @watched)
  `);

  const insert = (entry: Parameters<typeof stmt.run>[0]) => {
    const info = stmt.run(entry);
    return info.changes > 0;
  };

  try {
    // File upload (multipart/form-data) — used from browser on Railway
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = importExcelFromBuffer(buffer, insert);
      return NextResponse.json(result);
    }

    // File path (JSON) — used locally when file is on the same machine
    const body = await req.json().catch(() => ({})) as { filePath?: string };
    const filePath = body.filePath
      ?? process.env.EXCEL_PATH
      ?? path.join(process.cwd(), '..', 'Downloads', 'Movies.xlsx');

    const result = importExcel(filePath, insert);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
