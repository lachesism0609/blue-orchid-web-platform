CREATE TABLE IF NOT EXISTS error_events (
  id TEXT PRIMARY KEY, source TEXT NOT NULL, message TEXT NOT NULL, stack TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '', user_agent TEXT NOT NULL DEFAULT '', ip_hash TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS error_events_created_at_idx ON error_events(created_at);
CREATE INDEX IF NOT EXISTS error_events_source_idx ON error_events(source);
