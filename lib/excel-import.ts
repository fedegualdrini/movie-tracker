import * as XLSX from 'xlsx';
import path from 'path';

export interface ImportResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

interface SectionConfig {
  title: number;
  year: number;
  score: number;
}

interface SheetConfig {
  movies: SectionConfig;
  series: SectionConfig;
  anime?: SectionConfig;
}

const SHEET_CONFIG: Record<string, SheetConfig> = {
  '2026': {
    movies: { title: 0, year: 1, score: 2 },
    series: { title: 4, year: 5, score: 6 },
    anime:  { title: 8, year: 9, score: 10 },
  },
  '2025': {
    movies: { title: 0, year: 1, score: 2 },
    series: { title: 6, year: 7, score: 8 },
  },
  '2024': {
    movies: { title: 0, year: 1, score: 2 },
    series: { title: 7, year: 8, score: 9 },
  },
};

interface ParsedEntry {
  title: string;
  release_year: number;
  media_type: 'movie' | 'series' | 'anime';
  sheet_year: number;
  personal_score: number | null;
  watched: 0 | 1;
}

function parseSection(
  rows: unknown[][],
  cfg: SectionConfig,
  mediaType: 'movie' | 'series' | 'anime',
  sheetYear: number
): ParsedEntry[] {
  const results: ParsedEntry[] = [];
  // Skip row 0 (header)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const title = row[cfg.title];
    const yearRaw = row[cfg.year];
    const scoreRaw = row[cfg.score];

    if (!title || typeof title !== 'string' || !title.trim()) continue;
    const titleStr = title.trim();
    if (['Peliculas:', 'Series:', 'Anime', 'Overall'].includes(titleStr)) continue;

    const year = typeof yearRaw === 'number' ? Math.round(yearRaw) : parseInt(String(yearRaw));
    if (isNaN(year) || year < 1900 || year > 2100) continue;

    let personal_score: number | null = null;
    let watched: 0 | 1 = 0;

    if (scoreRaw !== null && scoreRaw !== undefined) {
      const scoreStr = String(scoreRaw).trim().toLowerCase();
      if (scoreStr === 'no visto' || scoreStr === '') {
        personal_score = null;
        watched = 0;
      } else {
        const n = parseFloat(scoreStr);
        if (!isNaN(n)) {
          personal_score = n;
          watched = 1;
        }
      }
    }

    results.push({ title: titleStr, release_year: year, media_type: mediaType, sheet_year: sheetYear, personal_score, watched });
  }
  return results;
}

export function importExcel(
  filePath: string,
  insertFn: (entry: ParsedEntry) => boolean
): ImportResult {
  const absPath = path.resolve(filePath);
  const wb = XLSX.readFile(absPath);
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const sheetName of wb.SheetNames) {
    const cfg = SHEET_CONFIG[sheetName];
    if (!cfg) continue; // skip Template and unknown sheets

    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
    const sheetYear = parseInt(sheetName);

    const sections: Array<[SectionConfig, 'movie' | 'series' | 'anime']> = [
      [cfg.movies, 'movie'],
      [cfg.series, 'series'],
    ];
    if (cfg.anime) sections.push([cfg.anime, 'anime']);

    for (const [sectionCfg, mediaType] of sections) {
      const entries = parseSection(rows, sectionCfg, mediaType, sheetYear);
      for (const entry of entries) {
        try {
          const wasInserted = insertFn(entry);
          if (wasInserted) inserted++;
          else skipped++;
        } catch (err) {
          errors.push(`${entry.title} (${entry.media_type} ${sheetYear}): ${String(err)}`);
        }
      }
    }
  }

  return { inserted, skipped, errors };
}
