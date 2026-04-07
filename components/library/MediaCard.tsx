import Link from 'next/link';
import Image from 'next/image';
import { getTmdbPosterUrl, scoreBg } from '@/lib/utils';

interface MediaRow {
  id: number;
  title: string;
  release_year: number;
  media_type: string;
  personal_score: number | null;
  watched: number;
  tmdb_poster_path: string | null;
  tmdb_score: number | null;
}

function Initials({ title }: { title: string }) {
  const words = title.split(' ').filter(Boolean);
  const letters = words.length >= 2 ? words[0][0] + words[1][0] : title.slice(0, 2);
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-200 text-2xl font-bold text-slate-500 uppercase dark:bg-slate-800 dark:text-slate-400">
      {letters}
    </div>
  );
}

export function MediaCard({ item }: { item: MediaRow }) {
  const posterUrl = getTmdbPosterUrl(item.tmdb_poster_path, 'w342');

  return (
    <Link href={`/media/${item.id}`} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-slate-100 aspect-[2/3] dark:bg-slate-800">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          />
        ) : (
          <Initials title={item.title} />
        )}

        {/* TMDB score on hover */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 translate-y-full transition-transform duration-200 group-hover:translate-y-0">
          {item.tmdb_score && (
            <p className="text-xs text-slate-300">TMDB: {item.tmdb_score.toFixed(1)}</p>
          )}
        </div>

        {/* Personal score badge */}
        <div className="absolute top-2 right-2">
          {item.personal_score != null ? (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${scoreBg(item.personal_score)}`}>
              {item.personal_score.toFixed(1)}
            </span>
          ) : item.watched === 0 ? (
            <span className="inline-flex items-center rounded-full bg-slate-900/70 px-2 py-0.5 text-xs text-white">
              No Visto
            </span>
          ) : null}
        </div>

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center rounded-full bg-slate-900/60 px-1.5 py-0.5 text-[10px] text-white capitalize">
            {item.media_type}
          </span>
        </div>
      </div>

      <div className="mt-1.5 px-0.5">
        <p className="truncate text-sm font-medium text-slate-900 group-hover:text-slate-600 dark:text-slate-100 dark:group-hover:text-slate-400">
          {item.title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500">{item.release_year}</p>
      </div>
    </Link>
  );
}
