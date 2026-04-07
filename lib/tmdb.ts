const BASE = 'https://api.themoviedb.org/3';

function apiKey(): string | null {
  // Bracket notation prevents Turbopack/webpack from inlining at build time.
  // .trim() guards against accidental whitespace/tabs from copy-paste in Railway env vars.
  return process.env['TMDB_API_KEY']?.trim() || null;
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

/**
 * Find the best TMDB match for a title.
 *
 * Problem with naive results[0]: year-filtered searches return wrong matches
 * when the stored year is when the user watched (e.g. Season 2 in 2024)
 * rather than the show's first air date (2021). "Arcane Afterglow" (2024)
 * would beat "Arcane" (2021) in a year=2024 search.
 *
 * Strategy:
 * 1. Search with year → collect results
 * 2. Search without year → collect results
 * 3. Deduplicate by id, score each by title similarity
 * 4. Exact title match wins; otherwise fall back to vote_count as tiebreaker
 */
export async function findBestTmdbMatch(
  query: string,
  type: 'movie' | 'tv',
  year?: number
): Promise<TmdbSearchResult | null> {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const nq = normalize(query);

  function titleSimilarity(result: TmdbSearchResult): number {
    const raw = result.title ?? result.name ?? '';
    const nr = normalize(raw);
    if (nr === nq) return 3;           // exact match
    if (nr === nq + 'the' || 'the' + nr === nq) return 2; // "the" article variant
    if (nr.startsWith(nq + ':') || nr.startsWith(nq + ' ')) return 1; // subtitle ("Arcane: …")
    if (nr === nq.replace(/\s*\d+$/, '')) return 1; // strip trailing number
    return 0;
  }

  // Fetch with and without year in parallel (year-only is faster but less reliable)
  const [withYear, withoutYear] = await Promise.all([
    year ? searchTmdb(query, type, year) : Promise.resolve([] as TmdbSearchResult[]),
    searchTmdb(query, type),
  ]);

  // Merge, deduplicate by id
  const seen = new Set<number>();
  const all: TmdbSearchResult[] = [];
  for (const r of [...withYear, ...withoutYear]) {
    if (!seen.has(r.id)) { seen.add(r.id); all.push(r); }
  }

  if (all.length === 0) return null;

  // Score: title similarity first, then vote_count as tiebreaker
  all.sort((a, b) => {
    const sd = titleSimilarity(b) - titleSimilarity(a);
    if (sd !== 0) return sd;
    return (b.vote_average ?? 0) - (a.vote_average ?? 0);
  });

  return all[0];
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

/** Deep diagnostic — call from /api/debug only, not for production use */
export async function debugInternals(): Promise<object> {
  const key = process.env['TMDB_API_KEY'] ?? null;
  const keyViaFn = apiKey();

  if (!key && !keyViaFn) {
    return { step: 'no_key', process_env_direct: key, apiKey_fn: keyViaFn };
  }

  const useKey = key ?? keyViaFn ?? '';
  const url = new URL(`${BASE}/search/movie`);
  url.searchParams.set('api_key', useKey);
  url.searchParams.set('query', 'The Creator');
  const urlSafe = url.toString().replace(useKey, useKey.slice(0, 6) + '***');

  try {
    const res = await fetch(url.toString(), { cache: 'no-store' });
    let body: unknown = null;
    try { body = await res.json(); } catch { body = '(non-json)'; }
    const results = (body as { results?: unknown[] })?.results;
    return {
      step: 'fetch_done',
      key_direct: key?.slice(0, 8),
      key_via_fn: keyViaFn?.slice(0, 8),
      url: urlSafe,
      status: res.status,
      ok: res.ok,
      result_count: results?.length ?? null,
      body_preview: JSON.stringify(body)?.slice(0, 200),
    };
  } catch (err) {
    return { step: 'fetch_error', url: urlSafe, error: String(err) };
  }
}
