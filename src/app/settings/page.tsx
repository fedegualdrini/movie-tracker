import { CheckCircle2, XCircle } from 'lucide-react';
import { SettingsClient } from './SettingsClient';
import { EnrichAllButton } from '@/components/detail/EnrichAllButton';
import db from '@/db/client';

export const dynamic = 'force-dynamic';

interface CountRow {
  media_type: string;
  sheet_year: number;
  count: number;
  watched: number;
}

export default function SettingsPage() {
  const tmdbKey = Boolean(process.env.TMDB_API_KEY);
  const omdbKey = Boolean(process.env.OMDB_API_KEY);

  const counts = db.prepare(`
    SELECT media_type, sheet_year, COUNT(*) as count, SUM(watched) as watched
    FROM media GROUP BY media_type, sheet_year ORDER BY sheet_year DESC, media_type
  `).all() as CountRow[];

  const total = counts.reduce((s, r) => s + r.count, 0);
  const totalWatched = counts.reduce((s, r) => s + (r.watched ?? 0), 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>

      {/* Stats */}
      <section className="rounded-xl border border-slate-200 p-5 space-y-3 dark:border-slate-800">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">Library Stats</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Total entries" value={total} />
          <Stat label="Watched" value={totalWatched} />
          <Stat label="No Visto" value={total - totalWatched} />
          <Stat label="Enriched" value={(db.prepare("SELECT COUNT(*) as c FROM media WHERE enriched_at IS NOT NULL").get() as { c: number }).c} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-600 dark:text-slate-400">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wide dark:border-slate-800">
                <th className="pb-1 text-left">Type</th>
                <th className="pb-1 text-left">Tracked In</th>
                <th className="pb-1 text-right">Total</th>
                <th className="pb-1 text-right">Watched</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {counts.map((r) => (
                <tr key={`${r.media_type}-${r.sheet_year}`}>
                  <td className="py-1 capitalize">{r.media_type}</td>
                  <td className="py-1">{r.sheet_year}</td>
                  <td className="py-1 text-right">{r.count}</td>
                  <td className="py-1 text-right">{r.watched ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* API Keys */}
      <section className="rounded-xl border border-slate-200 p-5 space-y-4 dark:border-slate-800">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">API Keys</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Add these to{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800 dark:text-slate-300">.env.local</code>{' '}
          in the project root, then restart the dev server.
        </p>
        <ApiKeyRow
          name="TMDB_API_KEY"
          hint="Get free key at themoviedb.org — enables posters, metadata, TMDB scores"
          active={tmdbKey}
        />
        <ApiKeyRow
          name="OMDB_API_KEY"
          hint="Get free key at omdbapi.com — enables Rotten Tomatoes scores (1,000 req/day)"
          active={omdbKey}
        />
      </section>

      {/* Bulk Enrichment */}
      <section className="rounded-xl border border-slate-200 p-5 space-y-4 dark:border-slate-800">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">Bulk Metadata Enrichment</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Automatically fetch posters, TMDB scores, and Rotten Tomatoes scores for all
          un-enriched entries. Processes ~3 items per second to stay within API limits.
        </p>
        <EnrichAllButton />
      </section>

      <SettingsClient />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-900">
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{String(value)}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function ApiKeyRow({ name, hint, active }: { name: string; hint: string; active: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 ${active ? 'text-green-500' : 'text-slate-300 dark:text-slate-600'}`}>
        {active ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      </div>
      <div>
        <code className="text-xs font-mono text-slate-800 dark:text-slate-200">{name}</code>
        {active && <span className="ml-2 text-xs text-green-600 font-medium dark:text-green-400">configured</span>}
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      </div>
    </div>
  );
}
