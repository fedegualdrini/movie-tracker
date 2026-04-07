'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
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
}

const YEARS = Array.from({ length: 5 }, (_, i) => 2026 - i);

const selectClass =
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ' +
  'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

const labelClass = 'text-sm font-medium text-slate-700 dark:text-slate-300';
const sectionClass = 'rounded-xl border border-slate-200 p-4 space-y-3 dark:border-slate-800';
const headingClass = 'text-sm font-semibold text-slate-700 dark:text-slate-300';

export default function AddPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'movie' | 'tv'>('movie');
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<TmdbResult | null>(null);
  const [form, setForm] = useState({
    title: '',
    release_year: '',
    media_type: 'movie' as 'movie' | 'series' | 'anime',
    sheet_year: '2026',
    personal_score: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}&type=${searchType}`);
      const data = await res.json() as { results: TmdbResult[] };
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function selectResult(r: TmdbResult) {
    setSelected(r);
    const year = (r.release_date ?? r.first_air_date ?? '').slice(0, 4);
    setForm((f) => ({
      ...f,
      title: r.title ?? r.name ?? '',
      release_year: year,
      media_type: searchType === 'movie' ? 'movie' : 'series',
    }));
    setResults([]);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const score = form.personal_score.trim() === '' ? null : parseFloat(form.personal_score);
    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          release_year: parseInt(form.release_year),
          media_type: form.media_type,
          sheet_year: parseInt(form.sheet_year),
          personal_score: score,
        }),
      });
      const data = await res.json() as { id?: number; error?: string };
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return; }
      router.push(`/media/${data.id}`);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Add Entry</h1>

      {/* TMDB Search */}
      <div className={`mb-6 ${sectionClass}`}>
        <h2 className={headingClass}>Search TMDB (optional)</h2>
        <div className="flex gap-2">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'movie' | 'tv')}
            className={`rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100`}
          >
            <option value="movie">Movie</option>
            <option value="tv">TV / Anime</option>
          </select>
          <div className="flex flex-1 gap-2">
            <Input
              placeholder="Search title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
            <Button onClick={search} disabled={searching} variant="outline">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-1 max-h-72 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => selectResult(r)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="relative h-14 w-10 flex-shrink-0 overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
                  {r.poster_path && (
                    <Image
                      src={getTmdbPosterUrl(r.poster_path, 'w185') ?? ''}
                      alt={r.title ?? r.name ?? ''}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{r.title ?? r.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {(r.release_date ?? r.first_air_date ?? '').slice(0, 4)}
                    {r.vote_average ? ` · TMDB ${r.vote_average.toFixed(1)}` : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <p className="text-xs text-green-600 dark:text-green-400">
            ✓ Selected: {selected.title ?? selected.name}
          </p>
        )}
      </div>

      {/* Manual form */}
      <div className={`space-y-4 ${sectionClass}`}>
        <h2 className={headingClass}>Entry Details</h2>

        <div className="space-y-1">
          <label className={labelClass}>Title *</label>
          <Input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Title"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelClass}>Release Year *</label>
            <Input
              type="number"
              value={form.release_year}
              onChange={(e) => setForm((f) => ({ ...f, release_year: e.target.value }))}
              placeholder="e.g. 2024"
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Your Score</label>
            <Input
              type="number"
              min="0" max="10" step="0.5"
              value={form.personal_score}
              onChange={(e) => setForm((f) => ({ ...f, personal_score: e.target.value }))}
              placeholder="0–10 (blank = No Visto)"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelClass}>Type *</label>
            <select
              value={form.media_type}
              onChange={(e) => setForm((f) => ({ ...f, media_type: e.target.value as 'movie' | 'series' | 'anime' }))}
              className={selectClass}
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
              onChange={(e) => setForm((f) => ({ ...f, sheet_year: e.target.value }))}
              className={selectClass}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          onClick={save}
          disabled={saving || !form.title || !form.release_year}
          className="w-full"
        >
          {saving ? 'Adding…' : 'Add to Library'}
        </Button>
      </div>
    </div>
  );
}
