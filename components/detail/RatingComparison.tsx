import { rtToDecimal, scoreColor } from '@/lib/utils';

interface GaugeProps {
  label: string;
  value: number | null;
  displayValue: string;
}

function Gauge({ label, value, displayValue }: GaugeProps) {
  const normalized = value != null ? Math.min(Math.max(value, 0), 10) : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const filled = value != null ? (normalized / 10) * circumference : 0;
  const color = value == null ? '#64748b' : normalized >= 7 ? '#22c55e' : normalized >= 5 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-700" />
          <circle
            cx="44" cy="44" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - filled}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${value == null ? 'text-slate-400' : scoreColor(value)}`}>
            {displayValue}
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</span>
    </div>
  );
}

interface RatingComparisonProps {
  personalScore: number | null;
  tmdbScore: number | null;
  rtScore: string | null;
}

export function RatingComparison({ personalScore, tmdbScore, rtScore }: RatingComparisonProps) {
  const rtDecimal = rtToDecimal(rtScore);
  const delta = personalScore != null && tmdbScore != null
    ? (personalScore - tmdbScore).toFixed(1)
    : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Rating Comparison
      </h3>
      <div className="flex justify-around">
        <Gauge label="Your Rating" value={personalScore} displayValue={personalScore != null ? personalScore.toFixed(1) : '—'} />
        <Gauge label="TMDB" value={tmdbScore} displayValue={tmdbScore != null ? tmdbScore.toFixed(1) : '—'} />
        <Gauge label="Rotten Tomatoes" value={rtDecimal} displayValue={rtScore ?? '—'} />
      </div>
      {delta && (
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          You rated it{' '}
          <span className={parseFloat(delta) >= 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
            {parseFloat(delta) >= 0 ? '+' : ''}{delta} pts
          </span>{' '}
          {parseFloat(delta) >= 0 ? 'higher' : 'lower'} than TMDB
        </p>
      )}
    </div>
  );
}
