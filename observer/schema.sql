CREATE TABLE IF NOT EXISTS crawler_counts (
 day TEXT NOT NULL,
 crawler TEXT NOT NULL,
 company TEXT NOT NULL,
 kind TEXT NOT NULL,
 verification TEXT NOT NULL,
 path TEXT NOT NULL,
 request_count INTEGER NOT NULL DEFAULT 1,
 last_seen_at TEXT NOT NULL,
 PRIMARY KEY(day,crawler,verification,path)
);
CREATE TABLE IF NOT EXISTS official_ranges (
 crawler TEXT PRIMARY KEY,
 ranges_json TEXT NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS observer_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
