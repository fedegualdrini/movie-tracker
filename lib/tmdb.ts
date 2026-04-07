const BASE = 'https://api.themoviedb.org/3';

function apiKey(): string | null {
  // Bracket notation prevents Turbopack/webpack from inlining this at build time.
  // Dot notation (process.env.TMDB_API_KEY) gets baked in as undefined if the
  // var isn't present during the build, breaking runtime reads in lib files.
  return process.env['TMDB_API_KEY'] ?? null;
}

async function get<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  const key = apiKey();
  if (!key) {
    console.warn('[TMDB] TMDB_API_KEY is not set — skipping request to', endpoint);
    return null;
  }
  const url = new URL(`${BASE}${endpoint}`);
  url.searchParams.set('api_key', key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) {
    console.warn(`[TMDB] Request failed: ${res.status} ${res.statusText} — ${endpoint}`);
    return null;
  }
  return res.json() as Promise<T>;
}

export interface TmdbSearchResult {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  vote_average?: number;
  overview?: string;
}

interface TmdbSearchResponse {
  results: TmdbSearchResult[];
}

export async function searchTmdb(
  query: string,
  type: 'movie' | 'tv',
  year?: number
): Promise<TmdbSearchResult[]> {
  const params: Record<string, string> = { query };
  if (year) {
    if (type === 'movie') params.year = String(year);
    else params.first_air_date_year = String(year);
  }
  const data = await get<TmdbSearchResponse>(`/search/${type}`, params);
  return data?.results?.slice(0, 10) ?? [];
}

export interface TmdbDetails {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  genres?: Array<{ id: number; name: string }>;
  release_date?: string;
  first_air_date?: string;
}

export async function getTmdbDetails(
  id: number,
  type: 'movie' | 'tv'
): Promise<TmdbDetails | null> {
  return get<TmdbDetails>(`/${type}/${id}`);
}

export interface TmdbExternalIds {
  imdb_id?: string | null;
}

export async function getTmdbExternalIds(
  id: number,
  type: 'movie' | 'tv'
): Promise<TmdbExternalIds | null> {
  return get<TmdbExternalIds>(`/${type}/${id}/external_ids`);
}

export function getPosterUrl(posterPath: string | null | undefined, size = 'w500'): string | null {
  if (!posterPath) return null;
  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
}

export function hasApiKey(): boolean {
  return Boolean(apiKey());
}
