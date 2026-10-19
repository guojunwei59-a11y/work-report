-- Apply ALTER once to existing databases, before deploying V1.4.
-- Fresh installations use schema.sql and must not run this ALTER again.
ALTER TABLE crawler_counts ADD COLUMN first_seen_at TEXT;
-- One request has a provable first timestamp; multiple old requests do not.
UPDATE crawler_counts SET first_seen_at=last_seen_at WHERE request_count=1 AND first_seen_at IS NULL;
UPDATE crawler_counts SET kind='training' WHERE crawler IN ('GPTBot','ClaudeBot','KimiBot','meta-externalagent');
UPDATE crawler_counts SET kind='search' WHERE crawler IN ('OAI-SearchBot','PerplexityBot','Claude-SearchBot','Kimi-SearchBot','Googlebot','bingbot');
CREATE TABLE IF NOT EXISTS indexnow_pages(url TEXT PRIMARY KEY,lastmod TEXT NOT NULL,status INTEGER NOT NULL,submitted_at TEXT NOT NULL);
