import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import db from '@/db/client';

export const dynamic = 'force-dynamic';
import { getTmdbPosterUrl, scoreColor } from '@/lib/utils';
import { RatingComparison } from '@/components/detail/RatingComparison';
import { EnrichButton } from '@/components/detail/EnrichButton';
import { EditEntryForm } from '@/components/detail/EditEntryForm';
import { Badge } from '@/components/ui/badge';
import { SeasonSelector } from '@/components/detail/SeasonSelector';
import { WatchSection } from '@/components/detail/WatchSection';

interface TmdbSeason {
  season_number: number;
  name: string;
  episode_count: number;
  vote_average: number;
  air_date?: string | null;
}

interface MediaRow {
  id: number;
  title: string;
  release_year: number;
  media_type: string;
  sheet_year: number;
  season_number: number;
  personal_score: number | null;
  watched: number;
  tmdb_id: number | null;
  tmdb_score: number | null;
  tmdb_vote_count: number | null;
  tmdb_overview: string | null;
  tmdb_poster_path: string | null;
  tmdb_genres: string | null;
  tmdb_seasons: string | null;
  imdb_id: string | null;
  rt_score: string | null;
  enriched_at: string | null;
}

interface RelatedSeason {
  id: number;
  season_number: number;
  release_year: number;
  personal_score: number | null;
  sheet_year: number;
}

export default async function MediaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = db.prepare('SELECT * FROM media WHERE id = ?').get(parseInt(id)) as MediaRow | undefined;
  if (!item) notFound();

  const isSeries = item.media_type === 'series' || item.media_type === 'anime';
  const seasonNumber = item.season_number ?? 1;

  // All user-rated seasons for this show (series/anime only)
  const relatedSeasons = isSeries
    ? (db.prepare(`
        SELECT id, season_number, release_year, personal_score, sheet_year
        FROM media WHERE title = ? AND media_type = ?
        ORDER BY season_number ASC, sheet_year ASC
      `).all(item.title, item.media_type) as RelatedSeason[])
    : [];

  const posterUrl = getTmdbPosterUrl(item.tmdb_poster_path, 'w500');
  const genres: string[] = item.tmdb_genres ? JSON.parse(item.tmdb_genres) : [];
  // TMDB seasons from the enriched data (all seasons of the show)
  const tmdbSeasons: TmdbSeason[] = item.tmdb_seasons ? JSON.parse(item.tmdb_seasons) : [];
  const hasTmdbKey = Boolean(process.env['TMDB_API_KEY']);

  // The TMDB season matching this entry's season_number (for the rating comparison)
  const matchedTmdbSeason = tmdbSeasons.find(s => s.season_number === seasonNumber) ?? null;
  const tmdbScoreForSeason = matchedTmdbSeason?.vote_average ?? item.tmdb_score;

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
              {isSeries && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                  Season {seasonNumber}
                </span>
              )}
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

      {/* Rating comparison — uses season-specific TMDB score when available */}
      <div className="mt-8">
        <RatingComparison
          personalScore={item.personal_score}
          tmdbScore={tmdbScoreForSeason}
          rtScore={item.rt_score}
        />
      </div>

      {item.tmdb_vote_count && !matchedTmdbSeason && (
        <p className="mt-2 text-center text-xs text-slate-400">
          TMDB score based on {item.tmdb_vote_count.toLocaleString()} votes
        </p>
      )}
      {matchedTmdbSeason && (
        <p className="mt-2 text-center text-xs text-slate-400">
          TMDB Season {seasonNumber} score · {matchedTmdbSeason.episode_count} episodes
        </p>
      )}

      {/* Watch player — only when TMDB ID is available */}
      {item.tmdb_id && (
        <WatchSection
          tmdbId={item.tmdb_id}
          type={isSeries ? 'tv' : 'movie'}
          tmdbSeasons={tmdbSeasons}
          defaultSeason={seasonNumber}
        />
      )}

      {/* All seasons from TMDB with user scores overlaid */}
      {tmdbSeasons.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">All Seasons</h2>
          <SeasonSelector
            tmdbSeasons={tmdbSeasons}
            relatedSeasons={relatedSeasons}
            currentSeasonNumber={seasonNumber}
            parentEntry={{
              title: item.title,
              media_type: item.media_type,
              sheet_year: item.sheet_year,
              release_year: item.release_year,
            }}
          />
          {relatedSeasons.filter(r => !tmdbSeasons.find(s => s.season_number === r.season_number)).length > 0 && (
            <p className="mt-2 text-xs text-slate-400">
              Some rated seasons not yet matched to TMDB — re-enrich to update.
            </p>
          )}
        </div>
      )}

      {/* If no TMDB season data yet but multiple user seasons exist */}
      {tmdbSeasons.length === 0 && relatedSeasons.length > 1 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Your Season Ratings</h2>
          <div className="flex flex-wrap gap-2">
            {relatedSeasons.map(r => (
              <Link
                key={r.id}
                href={`/media/${r.id}`}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${r.id === item.id ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'}`}
              >
                <span className="font-medium">S{r.season_number}</span>
                {r.personal_score != null && (
                  <span className={`ml-2 font-bold ${scoreColor(r.personal_score)}`}>{r.personal_score.toFixed(1)}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
