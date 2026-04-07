import { importExcel } from '../lib/excel-import';
import db from '../db/client';
import path from 'path';

const filePath = process.env.EXCEL_PATH ?? path.join(process.cwd(), '..', 'Downloads', 'Movies.xlsx');

console.log(`Importing from: ${filePath}`);

const stmt = db.prepare(`
  INSERT OR IGNORE INTO media (title, release_year, media_type, sheet_year, personal_score, watched)
  VALUES (@title, @release_year, @media_type, @sheet_year, @personal_score, @watched)
`);

const result = importExcel(filePath, (entry) => {
  const info = stmt.run(entry);
  return info.changes > 0;
});

console.log(`Done! Inserted: ${result.inserted}, Skipped: ${result.skipped}`);
if (result.errors.length > 0) {
  console.error('Errors:', result.errors);
}

// Print counts by type
const counts = db.prepare(`
  SELECT media_type, sheet_year, COUNT(*) as count,
         SUM(watched) as watched_count
  FROM media
  GROUP BY media_type, sheet_year
  ORDER BY sheet_year DESC, media_type
`).all();
console.table(counts);
