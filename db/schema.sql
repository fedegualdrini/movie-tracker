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
