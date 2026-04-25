'use client';

import { useState } from 'react';
import { Play, X, ChevronDown } from 'lucide-react';
import { WatchPlayer } from './WatchPlayer';

interface TmdbSeason {
  season_number: number;
  name: string;
  episode_count: number;
}

interface Props {
  tmdbId: number;
  type: 'movie' | 'tv';
  tmdbSeasons?: TmdbSeason[];
  defaultSeason?: number;
}

const selectClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 appearance-none pr-8 ' +
  'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer';

export function WatchSection({ tmdbId, type, tmdbSeasons = [], defaultSeason = 1 }: Props) {
  const [open, setOpen] = useState(false);

  const validSeasons = tmdbSeasons.filter(s => s.episode_count > 0);
  const initialSeason = validSeasons.find(s => s.season_number === defaultSeason) ?? validSeasons[0];

  const [selectedSeason, setSelectedSeason] = useState<TmdbSeason | null>(initialSeason ?? null);
  const [selectedEpisode, setSelectedEpisode] = useState(1);

  function handleSeasonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sn = parseInt(e.target.value);
    const season = validSeasons.find(s => s.season_number === sn) ?? null;
    setSelectedSeason(season);
    setSelectedEpisode(1);
  }

  function handleOpen() {
    setOpen(true);
    // Small delay so the player scrolls into view after render
    setTimeout(() => {
      document.getElementById('watch-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  const episodes = selectedSeason
    ? Array.from({ length: selectedSeason.episode_count }, (_, i) => i + 1)
    : [];

  return (
    <div id="watch-player" className="mt-8">
      {!open ? (
        <button
          onClick={handleOpen}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 transition-colors active:scale-95"
        >
          <Play className="h-4 w-4 fill-white" />
          Watch Now
        </button>
      ) : (
        <div className="space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {type === 'movie' ? 'Watch' : 'Watch Episode'}
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Close
            </button>
          </div>

          {/* Series controls */}
          {type === 'tv' && validSeasons.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Season dropdown */}
              <div className="relative">
                <select
                  value={selectedSeason?.season_number ?? ''}
                  onChange={handleSeasonChange}
                  className={selectClass}
                >
                  {validSeasons.map(s => (
                    <option key={s.season_number} value={s.season_number}>
                      {s.name ?? `Season ${s.season_number}`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>

              {/* Episode dropdown */}
              {episodes.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedEpisode}
                    onChange={e => setSelectedEpisode(parseInt(e.target.value))}
                    className={selectClass}
                  >
                    {episodes.map(ep => (
                      <option key={ep} value={ep}>
                        Episode {ep}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              )}

              {selectedSeason && (
                <span className="text-xs text-slate-400">
                  S{selectedSeason.season_number} · E{selectedEpisode} of {selectedSeason.episode_count}
                </span>
              )}
            </div>
          )}

          {/* Player */}
          <WatchPlayer
            tmdbId={tmdbId}
            type={type}
            season={selectedSeason?.season_number}
            episode={selectedEpisode}
          />
        </div>
      )}
    </div>
  );
}
