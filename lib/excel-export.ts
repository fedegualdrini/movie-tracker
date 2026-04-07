import * as XLSX from 'xlsx';

interface MediaRow {
  title: string;
  release_year: number;
  media_type: 'movie' | 'series' | 'anime';
  sheet_year: number;
  personal_score: number | null;
  watched: number;
}

export function buildExportBuffer(rows: MediaRow[]): Buffer {
  const wb = XLSX.utils.book_new();
  const years = [2026, 2025, 2024];

  for (const year of years) {
    const yearRows = rows.filter((r) => r.sheet_year === year);
    const movies = yearRows.filter((r) => r.media_type === 'movie');
    const series = yearRows.filter((r) => r.media_type === 'series');
    const anime = yearRows.filter((r) => r.media_type === 'anime');

    const maxLen = Math.max(movies.length, series.length, anime.length, 0);
    const data: (string | number | null)[][] = [];

    // Header row
    if (year === 2026) {
      data.push(['Movies', 'Año', 'Score', null, 'Series', 'Año', 'Score', null, 'Anime', 'Año', 'Score']);
    } else {
      data.push(['Movies', 'Año', 'Score', null, null, null, 'Series', 'Año', 'Score']);
    }

    for (let i = 0; i < maxLen; i++) {
      const m = movies[i];
      const s = series[i];
      const a = anime[i];

      const scoreStr = (item: MediaRow | undefined): string | number | null => {
        if (!item) return null;
        if (!item.watched || item.personal_score == null) return 'No Visto';
        return item.personal_score;
      };

      if (year === 2026) {
        data.push([
          m?.title ?? null, m?.release_year ?? null, scoreStr(m), null,
          s?.title ?? null, s?.release_year ?? null, scoreStr(s), null,
          a?.title ?? null, a?.release_year ?? null, scoreStr(a),
        ]);
      } else {
        data.push([
          m?.title ?? null, m?.release_year ?? null, scoreStr(m), null, null, null,
          s?.title ?? null, s?.release_year ?? null, scoreStr(s),
        ]);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, String(year));
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
