'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LibraryFiltersProps {
  view: 'grid' | 'table';
}

const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'series', label: 'Series' },
  { value: 'anime', label: 'Anime' },
];

const YEARS = [
  { value: 'all', label: 'All Years' },
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
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

export function LibraryFilters({ view }: LibraryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const current = {
    type: searchParams.get('type') ?? 'all',
    year: searchParams.get('year') ?? 'all',
    watched: searchParams.get('watched') ?? 'all',
    sort: searchParams.get('sort') ?? 'title',
    search: searchParams.get('search') ?? '',
    view: searchParams.get('view') ?? view,
  };

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.delete('page');
    router.push(`/library?${params.toString()}`);
  }, [router, searchParams]);

  const pillBase = 'rounded-full px-3 py-1 text-xs font-medium transition-colors';
  const pillActive = 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900';
  const pillInactive = 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700';

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
        {[
          { label: 'Type', key: 'type', opts: TYPES },
          { label: 'Year', key: 'year', opts: YEARS },
          { label: 'Status', key: 'watched', opts: WATCHED },
          { label: 'Sort', key: 'sort', opts: SORTS },
        ].map(({ label, key, opts }) => (
          <div key={key} className="flex items-center gap-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">{label}:</span>
            {opts.map(({ value, label: optLabel }) => (
              <button
                key={value}
                onClick={() => update(key, value)}
                className={cn(pillBase, (current as Record<string, string>)[key] === value ? pillActive : pillInactive)}
              >
                {optLabel}
              </button>
            ))}
          </div>
        ))}
      </div>

      {(current.type !== 'all' || current.year !== 'all' || current.watched !== 'all' || current.search) && (
        <Button variant="ghost" size="sm" onClick={() => router.push('/library')}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
