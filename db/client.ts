import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(process.cwd(), 'data', 'movies.db');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS media (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  title            TEXT    NOT NULL,
  release_year     INTEGER NOT NULL,
  media_type       TEXT    NOT NULL CHECK(media_type IN ('movie','series','anime')),
  sheet_year       INTEGER NOT NULL,
  personal_score   REAL,
  watched          INTEGER NOT NULL DEFAULT 0,
  tmdb_id          INTEGER,
  tmdb_score       REAL,
  tmdb_vote_count  INTEGER,
  tmdb_overview    TEXT,
  tmdb_poster_path TEXT,
  tmdb_genres      TEXT,
  imdb_id          TEXT,
  rt_score         TEXT,
  enriched_at      TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(title, release_year, media_type, sheet_year)
);
CREATE INDEX IF NOT EXISTS idx_media_type  ON media(media_type);
CREATE INDEX IF NOT EXISTS idx_sheet_year  ON media(sheet_year);
CREATE INDEX IF NOT EXISTS idx_watched     ON media(watched);
CREATE INDEX IF NOT EXISTS idx_tmdb_id     ON media(tmdb_id);
`;

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

// During `next build`, 17 parallel workers all import this module simultaneously.
// Connecting to SQLite in all of them causes SQLITE_BUSY. Skip connection at
// build time — API route handlers are never actually called during the build,
// only imported for module-graph analysis.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

function createDb(): Database.Database {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new Database(DB_PATH);
  // busy_timeout: wait up to 10s on lock contention instead of throwing immediately.
  // Covers any remaining parallel access during hot-reload or concurrent requests.
  db.pragma('busy_timeout = 10000');
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  return db;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: Database.Database = isBuildPhase
  ? (null as unknown as Database.Database)
  : (globalThis.__db ?? createDb());

if (!isBuildPhase && process.env.NODE_ENV !== 'production') globalThis.__db = db;

export default db;
