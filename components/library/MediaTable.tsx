import Link from 'next/link';
import { ScoreBadge } from '@/components/shared/ScoreBadge';

interface MediaRow {
  id: number;
  title: string;
  release_year: number;
  media_type: string;
  sheet_year: number;
  personal_score: number | null;
  watched: number;
  tmdb_score: number | null;
  rt_score: string | null;
  tmdb_poster_path: string | null;
}

export function MediaTable({ items }: { items: MediaRow[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <p className="text-lg font-medium">No entries found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3 text-left">Title</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-left">Year</th>
            <th className="px-4 py-3 text-left">Tracked</th>
            <th className="px-4 py-3 text-center">Your Score</th>
            <th className="px-4 py-3 text-center">TMDB</th>
            <th className="px-4 py-3 text-center">RT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-900/50">
              <td className="px-4 py-3">
                <Link href={`/media/${item.id}`} className="font-medium text-slate-900 hover:text-slate-600 dark:text-slate-100 dark:hover:text-slate-400">
                  {item.title}
                </Link>
              </td>
              <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-400">{item.media_type}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item.release_year}</td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-500">{item.sheet_year}</td>
              <td className="px-4 py-3 text-center"><ScoreBadge score={item.personal_score} /></td>
              <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                {item.tmdb_score != null ? item.tmdb_score.toFixed(1) : '—'}
              </td>
              <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                {item.rt_score ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
