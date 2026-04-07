'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface TmdbSeason {
  season_number: number;
  name: string;
  episode_count: number;
  vote_average: number;
  air_date?: string | null;
}

interface RelatedSeason {
  id: number;
  season_number: number;
  release_year: number;
  personal_score: number | null;
  sheet_year: number;
}

interface ParentEntry {
  title: string;
  media_type: string;
  sheet_year: number;
  release_year: number;
}

interface LocalScore {
  id?: number;
  score: number | null;
}

interface Props {
  tmdbSeasons: TmdbSeason[];
  relatedSeasons: RelatedSeason[];
  currentSeasonNumber: number;
  parentEntry: ParentEntry;
}

export function SeasonSelector({ tmdbSeasons, relatedSeasons, currentSeasonNumber, parentEntry }: Props) {
  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const [localScores, setLocalScores] = useState<Record<number, LocalScore>>(() => {
    const init: Record<number, LocalScore> = {};
    for (const r of relatedSeasons) {
      init[r.season_number] = { id: r.id, score: r.personal_score };
    }
    return init;
  });
  const [inputScore, setInputScore] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedTmdb = tmdbSeasons.find(s => s.season_number === selectedNum);

  function handleSelect(num: number) {
    if (selectedNum === num) {
      setSelectedNum(null);
      return;
    }
    setSelectedNum(num);
    const local = localScores[num];
    setInputScore(local?.score?.toString() ?? '');
  }

  async function save() {
    if (selectedNum == null) return;
    const trimmed = inputScore.trim();
    const val = trimmed === '' ? null : parseFloat(trimmed);
    if (val !== null && (isNaN(val) || val < 0 || val > 10)) return;
    setSaving(true);

    const existing = localScores[selectedNum];
    if (existing?.id != null) {
      await fetch(`/api/media/${existing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personal_score: val }),
      });
      setLocalScores(prev => ({ ...prev, [selectedNum]: { ...prev[selectedNum], score: val } }));
    } else if (val !== null) {
      const tmdb = tmdbSeasons.find(s => s.season_number === selectedNum);
      const releaseYear = tmdb?.air_date ? parseInt(tmdb.air_date.slice(0, 4)) : parentEntry.release_year;
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: parentEntry.title,
          media_type: parentEntry.media_type,
          sheet_year: parentEntry.sheet_year,
          release_year: releaseYear,
          season_number: selectedNum,
          personal_score: val,
        }),
      });
      const newRow = await res.json() as { id?: number };
      if (newRow.id) {
        setLocalScores(prev => ({ ...prev, [selectedNum]: { id: newRow.id, score: val } }));
      }
    }

    setSaving(false);
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {tmdbSeasons.map((s) => {
          const isThis = s.season_number === currentSeasonNumber;
          const isSelected = s.season_number === selectedNum;
          const local = localScores[s.season_number];
          const score = s.vote_average;

          const borderColor =
            score >= 8 ? 'border-emerald-400 dark:border-emerald-700'
            : score >= 7 ? 'border-green-300 dark:border-green-700'
            : score >= 5 ? 'border-amber-300 dark:border-amber-700'
            : 'border-red-300 dark:border-red-700';

          const tmdbTextColor =
            score >= 8 ? 'text-emerald-700 dark:text-emerald-400'
            : score >= 7 ? 'text-green-700 dark:text-green-400'
            : score >= 5 ? 'text-amber-700 dark:text-amber-400'
            : 'text-red-700 dark:text-red-400';

          const bgColor = isSelected
            ? 'bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-400 dark:ring-indigo-500'
            : isThis
            ? 'bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-300 dark:ring-slate-600'
            : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/60';

          return (
            <button
              key={s.season_number}
              onClick={() => handleSelect(s.season_number)}
              className={`rounded-lg border p-3 text-left transition-all cursor-pointer ${borderColor} ${bgColor}`}
            >
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate leading-tight">
                {s.name}
                {isThis && <span className="ml-1 text-indigo-500 dark:text-indigo-400">←</span>}
              </p>

              <p className={`mt-1.5 text-lg font-bold tabular-nums ${tmdbTextColor}`}>
                {score.toFixed(1)}
                <span className="ml-1 text-[10px] font-normal text-slate-400">TMDB</span>
              </p>

              {local?.score != null ? (
                <p className="mt-1 text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                  {local.score.toFixed(1)}
                  <span className="ml-1 text-[10px] font-normal text-slate-400">you</span>
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">tap to score</p>
              )}

              <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                {s.episode_count} eps{s.air_date ? ` · ${s.air_date.slice(0, 4)}` : ''}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected season panel */}
      {selectedTmdb && (
        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{selectedTmdb.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectedTmdb.episode_count} episodes
                {selectedTmdb.air_date ? ` · ${selectedTmdb.air_date.slice(0, 4)}` : ''}
                {' · '}TMDB {selectedTmdb.vote_average.toFixed(1)}
              </p>
            </div>
            <button
              onClick={() => setSelectedNum(null)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Your score</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.5"
              placeholder="0 – 10"
              value={inputScore}
              onChange={(e) => setInputScore(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
              className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm tabular-nums dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {saving && <span className="text-xs text-slate-400">Saving…</span>}
            {!saving && localScores[selectedNum]?.score != null && (
              <span className="text-xs text-green-600 dark:text-green-400">Saved</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
