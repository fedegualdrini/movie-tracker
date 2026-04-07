import { Suspense } from 'react';
import { LibraryFilters } from '@/components/library/LibraryFilters';
import { MediaGrid } from '@/components/library/MediaGrid';
import { MediaTable } from '@/components/library/MediaTable';
import db from '@/db/client';

export const dynamic = 'force-dynamic';

interface SearchParams {
  type?: string;
  trackedYear?: string;
  releaseYear?: string;
  watched?: string;
  search?: string;
  sort?: string;
  view?: string;
}

function queryMedia(sp: SearchParams) {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (sp.type && sp.type !== 'all') { conditions.push('media_type = ?'); params.push(sp.type); }
  if (sp.trackedYear && sp.trackedYear !== 'all') { conditions.push('sheet_year = ?'); params.push(parseInt(sp.trackedYear)); }
  if (sp.releaseYear && sp.releaseYear !== 'all') { conditions.push('release_year = ?'); params.push(parseInt(sp.releaseYear)); }
  if (sp.watched === 'true') { conditions.push('watched = 1'); }
  else if (sp.watched === 'false') { conditions.push('watched = 0'); }
  if (sp.search) { conditions.push('title LIKE ?'); params.push(`%${sp.search}%`); }

  // For series/anime: show only one card per show (the first-ever entry by id).
  conditions.push(`(
    media_type = 'movie'
    OR id = (
      SELECT MIN(m2.id) FROM media m2
      WHERE m2.title = media.title AND m2.media_type = media.media_type
    )
  )`);

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortMap: Record<string, string> = {
    title: 'title ASC',
    score_desc: 'personal_score DESC NULLS LAST',
    score_asc: 'personal_score ASC NULLS LAST',
    year: 'release_year DESC',
    recent: 'sheet_year DESC, id DESC',
  };
  const orderBy = sortMap[sp.sort ?? 'title'] ?? 'title ASC';

  // Also fetch all scored season numbers per show as a comma-separated string
  const items = db.prepare(`
    SELECT media.*, (
      SELECT GROUP_CONCAT(sub.season_number)
      FROM (
        SELECT m2.season_number FROM media m2
        WHERE m2.title = media.title AND m2.media_type = media.media_type
          AND m2.personal_score IS NOT NULL
        ORDER BY m2.season_number
      ) sub
    ) as scored_seasons
    FROM media ${where} ORDER BY ${orderBy}
  `).all(...params);
  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM media ${where}`).get(...params) as { cnt: number }).cnt;
  return { items, total };
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const view = sp.view ?? 'grid';
  const { items, total } = queryMedia(sp);

  const sheetYears = (db.prepare('SELECT DISTINCT sheet_year FROM media ORDER BY sheet_year DESC').all() as { sheet_year: number }[]).map(r => r.sheet_year);
  const releaseYears = (db.prepare('SELECT DISTINCT release_year FROM media ORDER BY release_year DESC').all() as { release_year: number }[]).map(r => r.release_year);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Library</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{total} entries</p>
        </div>
      </div>

      <Suspense>
        <LibraryFilters view={view as 'grid' | 'table'} sheetYears={sheetYears} releaseYears={releaseYears} />
      </Suspense>

      <div className="mt-6">
        {view === 'table' ? (
          <MediaTable items={items as Parameters<typeof MediaTable>[0]['items']} />
        ) : (
          <MediaGrid items={items as Parameters<typeof MediaGrid>[0]['items']} />
        )}
      </div>
    </div>
  );
}
