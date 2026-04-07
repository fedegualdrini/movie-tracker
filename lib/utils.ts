import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function scoreColor(score: number | null | undefined): string {
  if (score == null) return 'text-muted-foreground';
  if (score >= 7) return 'text-green-500';
  if (score >= 5) return 'text-amber-500';
  return 'text-red-500';
}

export function scoreBg(score: number | null | undefined): string {
  if (score == null) return 'bg-muted text-muted-foreground';
  if (score >= 7) return 'bg-green-500/15 text-green-600';
  if (score >= 5) return 'bg-amber-500/15 text-amber-600';
  return 'bg-red-500/15 text-red-600';
}

export function rtToDecimal(rt: string | null | undefined): number | null {
  if (!rt) return null;
  const num = parseFloat(rt.replace('%', ''));
  if (isNaN(num)) return null;
  return num / 10;
}

export function getTmdbPosterUrl(
  path: string | null | undefined,
  size: 'w185' | 'w342' | 'w500' | 'w780' = 'w500'
): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
