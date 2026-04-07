const BASE = 'http://www.omdbapi.com/';

function apiKey(): string | null {
  return process.env['OMDB_API_KEY']?.trim() || null;
}

interface OmdbRating {
  Source: string;
  Value: string;
}

interface OmdbResponse {
  Response: 'True' | 'False';
  Ratings?: OmdbRating[];
  imdbRating?: string;
  Error?: string;
}

async function fetchOmdb(params: Record<string, string>): Promise<OmdbResponse | null> {
  const key = apiKey();
  if (!key) return null;
  const url = new URL(BASE);
  url.searchParams.set('apikey', key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = await res.json() as OmdbResponse;
    if (data.Response === 'False') return null;
    return data;
  } catch {
    return null;
  }
}

export interface OmdbResult {
  rtScore: string | null;
}

export async function fetchByImdbId(imdbId: string): Promise<OmdbResult | null> {
  const data = await fetchOmdb({ i: imdbId });
  if (!data) return null;
  return extractScores(data);
}

export async function fetchByTitle(title: string, year?: number): Promise<OmdbResult | null> {
  const params: Record<string, string> = { t: title };
  if (year) params.y = String(year);
  const data = await fetchOmdb(params);
  if (!data) return null;
  return extractScores(data);
}

function extractScores(data: OmdbResponse): OmdbResult {
  const rt = data.Ratings?.find((r) => r.Source === 'Rotten Tomatoes');
  return { rtScore: rt?.Value ?? null };
}

export function hasApiKey(): boolean {
  return Boolean(apiKey());
}
