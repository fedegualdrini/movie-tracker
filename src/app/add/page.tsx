'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, CheckCircle2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { getTmdbPosterUrl } from '@/lib/utils';

interface TmdbResult {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  vote_average?: number;
  overview?: string;
}

const YEARS = Array.from({ length: 6 }, (_, i) => 2026 - i);

const selectClass =
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ' +
  'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
const labelClass = 'text-sm font-medium text-slate-700 dark:text-slate-300';

type Step = 'form' | 'picking' | 'saving';

export default function AddPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    media_type: 'movie' as 'movie' | 'series' | 'anime',
    sheet_year: '2026',
    release_year: '',
    personal_score: '',
  });

  const [step, setStep] = useState<Step>('form');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [picked, setPicked] = useState<TmdbResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tmdbType = form.media_type === 'movie' ? 'movie' : 'tv';

  async function handleAdd() {
    setError(null);
    if (!form.title.trim()) { setError('Title is required'); return; }

    setSearching(true);
    try {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(form.title)}&type=${tmdbType}`);
      const data = await res.json() as { results: TmdbResult[] };
      const found = data.results ?? [];

      if (found.length === 0) {
        // No TMDB results — need manual release year then save directly
        if (!form.release_year.trim()) {
          setResults([]);
          setStep('picking'); // show empty picker with manual option
        } else {
          await saveEntry(null);
        }
      } else if (found.length === 1) {
        // Single result — auto-select and save
        await saveEntry(found[0]);
      } else {
        // Multiple results — let user pick
        setResults(found);
        setStep('picking');
      }
    } catch {
      setError('Failed to search TMDB. Check your connection.');
    } finally {
      setSearching(false);
    }
  }

  async function confirmPick(result: TmdbResult | null) {
    setPicked(result);
    if (result === null && !form.release_year.trim()) {
      setError('Please enter a release year to add without a TMDB match.');
      return;
    }
    await saveEntry(result);
  }

  async function saveEntry(tmdb: TmdbResult | null) {
    setError(null);
    setStep('saving');

    const releaseYear = tmdb
      ? parseInt((tmdb.release_date ?? tmdb.first_air_date ?? form.release_year).slice(0, 4))
      : parseInt(form.release_year);

    if (!releaseYear || isNaN(releaseYear)) {
      setError('Release year is required when skipping TMDB.');
      setStep('picking');
      return;
    }

    const score = form.personal_score.trim() === '' ? null : parseFloat(form.personal_score);

    try {
      // 1. Create the entry
      const createRes = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: tmdb ? (tmdb.title ?? tmdb.name ?? form.title) : form.title,
          release_year: releaseYear,
          media_type: form.media_type,
          sheet_year: parseInt(form.sheet_year),
          personal_score: score,
        }),
      });
      const created = await createRes.json() as { id?: number; error?: string };
      if (!createRes.ok || !created.id) {
        setError(created.error ?? 'Failed to create entry.');
        setStep(tmdb ? 'picking' : 'form');
        return;
      }

      // 2. Enrich with TMDB data (pass tmdb_id if user picked one)
      if (tmdb) {
        await fetch(`/api/media/${created.id}/enrich`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tmdb_id: tmdb.id }),
        });
      }

      router.push(`/media/${created.id}`);
    } catch {
      setError('Network error. Please try again.');
      setStep('form');
    }
  }

  // ── Form step ──────────────────────────────────────────────────────────────
  if (step === 'form' || step === 'picking') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Add Entry</h1>

        {/* Entry form */}
        <div className="rounded-xl border border-slate-200 p-5 space-y-4 dark:border-slate-800">
          <div className="space-y-1">
            <label className={labelClass}>Title *</label>
            <Input
              value={form.title}
              onChange={(e) => { setForm(f => ({ ...f, title: e.target.value })); setStep('form'); setResults([]); }}
              placeholder="e.g. Inception"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              disabled={step === 'picking'}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className={labelClass}>Type *</label>
              <select
                value={form.media_type}
                onChange={(e) => setForm(f => ({ ...f, media_type: e.target.value as 'movie' | 'series' | 'anime' }))}
                className={selectClass}
                disabled={step === 'picking'}
              >
                <option value="movie">Movie</option>
                <option value="series">Series</option>
                <option value="anime">Anime</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Year Tracked *</label>
              <select
                value={form.sheet_year}
                onChange={(e) => setForm(f => ({ ...f, sheet_year: e.target.value }))}
                className={selectClass}
                disabled={step === 'picking'}
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="space-y-1 col-span-2 sm:col-span-1">
              <label className={labelClass}>Your Score</label>
              <Input
                type="number"
                min="0" max="10" step="0.5"
                value={form.personal_score}
                onChange={(e) => setForm(f => ({ ...f, personal_score: e.target.value }))}
                placeholder="0–10 (optional)"
                disabled={step === 'picking'}
              />
            </div>
          </div>

          {error && step === 'form' && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {step === 'form' && (
            <Button
              onClick={handleAdd}
              disabled={searching || !form.title.trim()}
              className="w-full"
            >
              {searching
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Searching TMDB…</>
                : <><Search className="mr-2 h-4 w-4" />Search & Add</>}
            </Button>
          )}
        </div>

        {/* TMDB picker */}
        {step === 'picking' && (
          <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {results.length > 0
                  ? `${results.length} results found — pick the right one`
                  : 'No TMDB results found'}
              </p>
              <button onClick={() => { setStep('form'); setResults([]); setError(null); }}>
                <X className="h-4 w-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {results.map(r => (
                <button
                  key={r.id}
                  onClick={() => confirmPick(r)}
                  className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/30 group"
                >
                  <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
                    {r.poster_path && (
                      <Image
                        src={getTmdbPosterUrl(r.poster_path, 'w185') ?? ''}
                        alt={r.title ?? r.name ?? ''}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {r.title ?? r.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {(r.release_date ?? r.first_air_date ?? '').slice(0, 4)}
                      {r.vote_average ? ` · TMDB ${r.vote_average.toFixed(1)}` : ''}
                    </p>
                    {r.overview && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">{r.overview}</p>
                    )}
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-indigo-400 opacity-0 group-hover:opacity-100 flex-shrink-0 mt-1" />
                </button>
              ))}
            </div>

            {/* Skip option */}
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">None of these? Add manually:</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Release year"
                  value={form.release_year}
                  onChange={(e) => setForm(f => ({ ...f, release_year: e.target.value }))}
                  className="w-36"
                />
                <Button variant="outline" onClick={() => confirmPick(null)} className="flex-1">
                  Add without TMDB match
                </Button>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Saving step ────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 flex flex-col items-center gap-4 pt-24">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
        {picked ? `Saving & fetching metadata for "${picked.title ?? picked.name}"…` : 'Saving entry…'}
      </p>
    </div>
  );
}
