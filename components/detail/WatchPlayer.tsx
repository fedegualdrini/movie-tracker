'use client';

interface Props {
  tmdbId: number;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
}

export function WatchPlayer({ tmdbId, type, season, episode }: Props) {
  const src =
    type === 'movie'
      ? `https://vidsrcme.ru/embed/movie?tmdb=${tmdbId}`
      : `https://vidsrcme.ru/embed/tv?tmdb=${tmdbId}&season=${season ?? 1}&episode=${episode ?? 1}`;

  return (
    <div className="w-full overflow-hidden rounded-xl bg-black shadow-xl">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          key={src}
          src={src}
          className="absolute inset-0 h-full w-full"
          allowFullScreen
          allow="fullscreen; autoplay"
          referrerPolicy="origin"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
}
