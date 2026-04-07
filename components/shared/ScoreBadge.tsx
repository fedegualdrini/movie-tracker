import { scoreBg } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number | null | undefined;
  className?: string;
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  if (score == null) {
    return (
      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500', className)}>
        No Visto
      </span>
    );
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', scoreBg(score), className)}>
      {score.toFixed(1)}
    </span>
  );
}
