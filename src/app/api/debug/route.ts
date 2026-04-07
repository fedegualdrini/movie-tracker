import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const key = process.env.TMDB_API_KEY ?? null;

  if (!key) {
    return NextResponse.json({ error: 'TMDB_API_KEY is not set', env_keys: Object.keys(process.env).filter(k => !k.startsWith('npm_')) });
  }

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=The+Creator`;

  let status: number;
  let body: unknown;

  try {
    const res = await fetch(url);
    status = res.status;
    body = await res.json();
  } catch (err) {
    return NextResponse.json({ key_set: true, key_prefix: key.slice(0, 6), fetch_error: String(err) });
  }

  return NextResponse.json({
    key_set: true,
    key_prefix: key.slice(0, 6),
    tmdb_status: status,
    tmdb_response: body,
  });
}
