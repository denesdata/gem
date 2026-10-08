-- GEM Romania — SQLite source of truth (lives at ~/gem/db/gem.sqlite on the VM)
-- DELETE journal so the agent can mount the DB read-only without -wal/-shm writes.
PRAGMA journal_mode=DELETE;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS indicators (
  dataset     TEXT NOT NULL,   -- aps | nes
  year        INTEGER,
  country     TEXT,
  type        TEXT,
  value       REAL,
  lang        TEXT,
  langtype    TEXT,
  langcountry TEXT,
  iso3        TEXT,
  id          TEXT
);
CREATE INDEX IF NOT EXISTS idx_ind_lookup
  ON indicators(dataset, country, type, lang, year);

CREATE TABLE IF NOT EXISTS upcoming (
  date  TEXT,
  cat   TEXT,
  close TEXT,
  desc  TEXT,
  link  TEXT
);
CREATE INDEX IF NOT EXISTS idx_upcoming_cat ON upcoming(cat);

CREATE TABLE IF NOT EXISTS news (
  date  TEXT,
  type  TEXT,
  media TEXT,
  desc  TEXT,
  lang  TEXT,
  link  TEXT
);
CREATE INDEX IF NOT EXISTS idx_news_lang ON news(lang);

CREATE TABLE IF NOT EXISTS legal (
  date       TEXT,
  county     TEXT,
  id         INTEGER,
  lang       TEXT,
  langcounty TEXT,
  metric     TEXT,
  value      REAL
);
CREATE INDEX IF NOT EXISTS idx_legal_lookup ON legal(county, lang, metric);

CREATE TABLE IF NOT EXISTS rostats (
  year       INTEGER,
  county     TEXT,
  id         REAL,
  lang       TEXT,
  langcounty TEXT,
  metric     TEXT,
  value      REAL
);
CREATE INDEX IF NOT EXISTS idx_rostats_lookup ON rostats(county, lang, metric, year);

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);
