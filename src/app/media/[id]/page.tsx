import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import db from '@/db/client';

export const dynamic = 'force-dynamic';
import { getTmdbPosterUrl } from '@/lib/utils';
import { RatingComparison } from '@/components/detail/RatingComparison';
import { EnrichButton } from '@/components/detail/EnrichButton';
import { EditEntryForm } from '@/components/detail/EditEntryForm';
import { Badge } from '@/components/ui/badge';

interface MediaRow {
  id: number;
  title: string;
  release_year: number;
  media_type: string;
  sheet_year: number;
  personal_score: number | null;
  watched: number;
  tmdb_id: number | null;
  tmdb_score: number | null;
  tmdb_vote_count: number | null;
  tmdb_overview: string | null;
  tmdb_poster_path: string | null;
  tmdb_genres: string | null;
  imdb_id: string | null;
  rt_score: string | null;
  enriched_at: string | null;
}

export default async function MediaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = db.prepare('SELECT * FROM media WHERE id = ?').get(parseInt(id)) as MediaRow | undefined;
  if (!item) notFound();

  const posterUrl = getTmdbPosterUrl(item.tmdb_poster_path, 'w500');
  const genres: string[] = item.tmdb_genres ? JSON.parse(item.tmdb_genres) : [];
  const hasTmdbKey = Boolean(process.env.TMDB_API_KEY);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link href="/library" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to Library
      </Link>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Poster */}
        <div className="flex-shrink-0">
          <div className="relative h-80 w-52 overflow-hidden rounded-xl bg-slate-200 md:h-96 md:w-64 dark:bg-slate-800">
            {posterUrl ? (
              <Image src={posterUrl} alt={item.title} fill className="object-cover" sizes="256px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-slate-400 uppercase dark:text-slate-600">
                {item.title.slice(0, 2)}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 capitalize dark:bg-slate-800 dark:text-slate-300">
                {item.media_type}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">Tracked in {item.sheet_year}</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{item.title}</h1>
            <p className="text-lg text-slate-500 dark:text-slate-400">{item.release_year}</p>
          </div>

          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {genres.map((g) => (
                <Badge key={g} variant="secondary">{g}</Badge>
              ))}
            </div>
          )}

          {item.tmdb_overview && (
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.tmdb_overview}</p>
          )}

          {item.imdb_id && (
            <a
              href={`https://www.imdb.com/title/${item.imdb_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-600 hover:underline"
            >
              View on IMDb →
            </a>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <EditEntryForm item={item} />
            <EnrichButton id={item.id} enrichedAt={item.enriched_at} hasTmdbKey={hasTmdbKey} />
          </div>
        </div>
      </div>

      {/* Rating comparison */}
      <div className="mt-8">
        <RatingComparison
          personalScore={item.personal_score}
          tmdbScore={item.tmdb_score}
          rtScore={item.rt_score}
        />
      </div>

      {/* Stats */}
      {item.tmdb_vote_count && (
        <p className="mt-2 text-center text-xs text-slate-400">
          TMDB score based on {item.tmdb_vote_count.toLocaleString()} votes
        </p>
      )}
    </div>
  );
}
