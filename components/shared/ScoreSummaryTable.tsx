interface SummaryCell {
  avg: number | null;
  rated: number;
  total: number;
}

type SummaryData = Record<string, Record<string | 'overall', SummaryCell>>;

interface Props {
  data: SummaryData;
  years: number[];
}

const TYPE_LABELS: Record<string, string> = {
  movie: 'Movies',
  series: 'Series',
  anime: 'Anime',
};

const TYPE_COLORS: Record<string, string> = {
  movie: 'bg-violet-600 text-white',
  series: 'bg-rose-500 text-white',
  anime: 'bg-sky-500 text-white',
};

function scoreCell(cell: SummaryCell | undefined) {
  if (!cell || cell.rated === 0) {
    return (
      <td className="px-4 py-2.5 text-center text-xs text-slate-400 dark:text-slate-600">—</td>
    );
  }
  const s = cell.avg!;
  const bg =
    s >= 7 ? 'bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
    : s >= 5 ? 'bg-amber-400/30 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
    : 'bg-red-400/20 text-red-700 dark:bg-red-500/15 dark:text-red-400';

  return (
    <td className="px-4 py-2.5 text-center">
      <span className={`inline-block rounded-md px-2 py-0.5 text-sm font-bold tabular-nums ${bg}`}>
        {s.toFixed(2)}
      </span>
      <span className="ml-1 text-[10px] text-slate-400 dark:text-slate-600">{cell.rated}</span>
    </td>
  );
}

export function ScoreSummaryTable({ data, years }: Props) {
  const types = Object.keys(TYPE_LABELS).filter(t => data[t]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="w-28 pb-2" />
            <th className="pb-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4">
              Overall
            </th>
            {years.map(y => (
              <th key={y} className="pb-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4">
                {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {types.map(type => (
            <tr key={type} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="py-1.5 pr-3">
                <span className={`inline-flex w-full items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold ${TYPE_COLORS[type]}`}>
                  {TYPE_LABELS[type]}
                </span>
              </td>
              {scoreCell(data[type]?.['overall'])}
              {years.map(y => scoreCell(data[type]?.[String(y)]))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-right text-[10px] text-slate-400 dark:text-slate-600">
        Average personal score · small number = rated entries
      </p>
    </div>
  );
}
