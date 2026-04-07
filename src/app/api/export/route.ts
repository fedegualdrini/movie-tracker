import { NextResponse } from 'next/server';
import db from '@/db/client';
import { buildExportBuffer } from '@/lib/excel-export';

export const runtime = 'nodejs';

export async function GET() {
  const rows = db.prepare('SELECT * FROM media ORDER BY sheet_year DESC, media_type, title').all() as Parameters<typeof buildExportBuffer>[0];
  const buffer = buildExportBuffer(rows);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Movies_export.xlsx"',
    },
  });
}
