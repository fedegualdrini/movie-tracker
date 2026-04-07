'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LibraryFiltersProps {
  view: 'grid' | 'table';
  sheetYears: number[];
  releaseYears: number[];
}

const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'series', label: 'Series' },
  { value: 'anime', label: 'Anime' },
];

const WATCHED = [
  { value: 'all', label: 'All' },
  { value: 'true', label: 'Watched' },
  { value: 'false', label: 'No Visto' },
];

const SORTS = [
  { value: 'title', label: 'Title' },
  { value: 'score_desc', label: 'Score ↓' },
  { value: 'score_asc', label: 'Score ↑' },
  { value: 'year', label: 'Release Year' },
  { value: 'recent', label: 'Recently Added' },
];

export function LibraryFilters({ view, sheetYears, releaseYears }: LibraryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const current = {
    type: searchParams.get('type') ?? 'all',
    trackedYear: searchParams.get('trackedYear') ?? 'all',
    releaseYear: searchParams.get('releaseYear') ?? 'all',
    watched: searchParams.get('watched') ?? 'all',
    sort: searchParams.get('sort') ?? 'title',
    search: searchParams.get('search') ?? '',
    view: searchParams.get('view') ?? view,
  };

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all' || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete('page');
    router.push(`/library?${params.toString()}`);
  }, [router, searchParams]);

  const pillBase = 'rounded-full px-3 py-1 text-xs font-medium transition-colors';
  const pillActive = 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900';
  const pillInactive = 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700';
  const selectClass = 'rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700';

  const trackedYearOpts = [{ value: 'all', label: 'All' }, ...sheetYears.map(y => ({ value: String(y), label: String(y) }))];
  const hasActiveFilters = current.type !== 'all' || current.trackedYear !== 'all' || current.releaseYear !== 'all' || current.watched !== 'all' || current.search;

  return (
    <div className="space-y-3">
      {/* Search + View toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search titles..."
            value={current.search}
            onChange={(e) => update('search', e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex rounded-md border border-slate-200 overflow-hidden dark:border-slate-700">
          <button
            onClick={() => update('view', 'grid')}
            className={cn('px-3 py-2 transition-colors', current.view === 'grid'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800')}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => update('view', 'table')}
            className={cn('px-3 py-2 transition-colors', current.view === 'table'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800')}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-4">
        {/* Type */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">Type:</span>
          {TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update('type', value)}
              className={cn(pillBase, current.type === value ? pillActive : pillInactive)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tracked In (sheet_year = which Excel tab) */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">Tracked In:</span>
          {trackedYearOpts.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update('trackedYear', value)}
              className={cn(pillBase, current.trackedYear === value ? pillActive : pillInactive)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Release Year (actual movie release year — dropdown since many values) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Release Year:</span>
          <select
            value={current.releaseYear}
            onChange={(e) => update('releaseYear', e.target.value)}
            className={selectClass}
          >
            <option value="all">All</option>
            {releaseYears.map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">Status:</span>
          {WATCHED.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update('watched', value)}
              className={cn(pillBase, current.watched === value ? pillActive : pillInactive)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">Sort:</span>
          {SORTS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update('sort', value)}
              className={cn(pillBase, current.sort === value ? pillActive : pillInactive)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push('/library')}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
