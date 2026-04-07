import { MediaCard } from './MediaCard';

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

export function MediaGrid({ items }: { items: MediaRow[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <p className="text-lg font-medium">No entries found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) => (
        <MediaCard key={item.id} item={item} />
      ))}
    </div>
  );
}
