-- Migration 004: Create analytics tables
--
-- Four concerns, in dependency order:
--   1. daily_metrics      — one row per day: ambiance views (live) + visitors/DAU (nightly cron)
--   2. Ambiance views     — ambiance_view_log, 3-day rolling dedup per (ambiance, viewer)
--   3. Page views         — page_views + page_view_log, per-day dedup per (page, viewer)
--   4. Share hits         — share_hits, per-link hit counts for /share URLs
--
-- Retention (all enforced daily by src/app/lib/cron.ts):
--   ambiance_view_log  3 days    page_view_log  2 days    share_hits  30 days
--
-- All DB operations go through the admin client (service role key) which bypasses RLS.
-- Viewer keys are "user:<id>" for signed-in users or "anon:<sha256(ip:ua)>" otherwise
-- (see src/app/lib/analytics/viewerKey.ts). No raw IPs are stored.


-- ===========================================================================
-- 1. daily_metrics
-- ===========================================================================

CREATE TABLE IF NOT EXISTS daily_metrics (
  date                DATE PRIMARY KEY,
  ambiance_views      INTEGER NOT NULL DEFAULT 0,  -- live-incremented by record_ambiance_view
  daily_visitors      INTEGER NOT NULL DEFAULT 0,  -- nightly cron: distinct viewers (anon + signed-in) across tracked pages
  daily_active_users  INTEGER NOT NULL DEFAULT 0   -- nightly cron: distinct signed-in users from sessions.last_active
);

ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

-- Function: snapshot the previous day's visitor counts into daily_metrics.
-- Called by the nightly cron job for the previous day.
--   daily_active_users — signed-in users whose session was touched that day.
--                        sessions.last_active is bumped once per calendar day
--                        on any authenticated request (see getCurrentUser.ts),
--                        so this covers pages page_view_log doesn't track.
--   daily_visitors     — distinct viewer_keys (anon or user) in page_view_log.
--                        page_view_log is created in section 3; plpgsql resolves
--                        table names at call time so the order here is fine.
CREATE OR REPLACE FUNCTION snapshot_daily_metrics(p_date DATE)
RETURNS TABLE (daily_visitors INTEGER, daily_active_users INTEGER) AS $$
DECLARE
  v_visitors INTEGER;
  v_users    INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO v_users
  FROM sessions
  WHERE last_active >= p_date
    AND last_active < p_date + INTERVAL '1 day';

  SELECT COUNT(DISTINCT viewer_key) INTO v_visitors
  FROM page_view_log
  WHERE date = p_date;

  INSERT INTO daily_metrics (date, daily_visitors, daily_active_users)
  VALUES (p_date, v_visitors, v_users)
  ON CONFLICT (date)
  DO UPDATE SET daily_visitors     = v_visitors,
                daily_active_users = v_users;

  RETURN QUERY SELECT v_visitors, v_users;
END;
$$ LANGUAGE plpgsql;


-- ===========================================================================
-- 2. Ambiance views
-- ===========================================================================

CREATE TABLE IF NOT EXISTS ambiance_view_log (
  ambiance_id  VARCHAR(12) NOT NULL REFERENCES ambiances(id) ON DELETE CASCADE,
  viewer_key   TEXT NOT NULL,
  last_viewed  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ambiance_id, viewer_key)
);

-- Index for fast cleanup queries (cron deletes rows older than 3 days)
CREATE INDEX IF NOT EXISTS idx_ambiance_view_log_last_viewed
  ON ambiance_view_log(last_viewed);

ALTER TABLE ambiance_view_log ENABLE ROW LEVEL SECURITY;

-- Fix: update the ambiances updated_at trigger so view count increments
-- do not bump updated_at (only content edits should update it)
DROP TRIGGER IF EXISTS update_ambiances_updated_at ON ambiances;
CREATE TRIGGER update_ambiances_updated_at
  BEFORE UPDATE ON ambiances
  FOR EACH ROW
  WHEN (
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.video_data IS DISTINCT FROM NEW.video_data OR
    OLD.status IS DISTINCT FROM NEW.status OR
    OLD.thumbnail IS DISTINCT FROM NEW.thumbnail OR
    OLD.category_id IS DISTINCT FROM NEW.category_id
  )
  EXECUTE FUNCTION update_updated_at_column();

-- Function: record an ambiance view with 3-day per-viewer deduplication.
-- The window is anchored on the last *counted* view: revisits inside the
-- window are ignored and do not extend it, so a daily listener re-counts
-- every 4th day rather than never.
-- Also increments ambiances.views and daily_metrics.ambiance_views on valid views.
-- Returns TRUE if the view was counted, FALSE if it was a duplicate within 3 days.
CREATE OR REPLACE FUNCTION record_ambiance_view(
  p_ambiance_id VARCHAR(12),
  p_viewer_key  TEXT,
  p_date        DATE
) RETURNS BOOLEAN AS $$
DECLARE
  v_last_viewed TIMESTAMPTZ;
BEGIN
  SELECT last_viewed INTO v_last_viewed
  FROM ambiance_view_log
  WHERE ambiance_id = p_ambiance_id AND viewer_key = p_viewer_key;

  IF v_last_viewed IS NULL OR v_last_viewed < now() - INTERVAL '3 days' THEN
    INSERT INTO ambiance_view_log (ambiance_id, viewer_key, last_viewed)
    VALUES (p_ambiance_id, p_viewer_key, now())
    ON CONFLICT (ambiance_id, viewer_key)
    DO UPDATE SET last_viewed = now();

    UPDATE ambiances SET views = views + 1 WHERE id = p_ambiance_id;

    INSERT INTO daily_metrics (date) VALUES (p_date) ON CONFLICT (date) DO NOTHING;
    UPDATE daily_metrics SET ambiance_views = ambiance_views + 1 WHERE date = p_date;

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;


-- ===========================================================================
-- 3. Page views
-- ===========================================================================
-- Generic per-page counters keyed by (date, page). Tracking a new page needs
-- no migration: add its name to VALID_PAGES in
-- src/app/api/analytics/page-view/route.ts and fire usePageView() from it.

CREATE TABLE IF NOT EXISTS page_views (
  date          DATE NOT NULL,
  page          TEXT NOT NULL,   -- 'home' | 'create' | 'share' | 'categories' | 'ambiance' | ...
  views         INTEGER NOT NULL DEFAULT 0,
  unique_views  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date, page)
);

-- Per-day dedup of (page, viewer) so unique_views can be computed live.
CREATE TABLE IF NOT EXISTS page_view_log (
  page        TEXT NOT NULL,
  viewer_key  TEXT NOT NULL,
  date        DATE NOT NULL,
  PRIMARY KEY (page, viewer_key, date)
);

-- Index for fast cleanup queries (cron deletes rows older than 2 days;
-- dedup is per calendar day, and the nightly snapshot only reads yesterday)
CREATE INDEX IF NOT EXISTS idx_page_view_log_date
  ON page_view_log(date);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_view_log ENABLE ROW LEVEL SECURITY;

-- Function: record a page view for a given viewer on a given date.
-- Always increments page_views.views; increments unique_views only the first
-- time this viewer hits this page on this date.
-- Returns TRUE if the view was unique for the day, FALSE otherwise.
CREATE OR REPLACE FUNCTION record_page_view(
  p_page        TEXT,
  p_viewer_key  TEXT,
  p_date        DATE
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_unique BOOLEAN;
BEGIN
  INSERT INTO page_view_log (page, viewer_key, date)
  VALUES (p_page, p_viewer_key, p_date)
  ON CONFLICT (page, viewer_key, date) DO NOTHING;
  v_is_unique := FOUND;

  INSERT INTO page_views (date, page, views, unique_views)
  VALUES (p_date, p_page, 1, CASE WHEN v_is_unique THEN 1 ELSE 0 END)
  ON CONFLICT (date, page) DO UPDATE
    SET views        = page_views.views + 1,
        unique_views = page_views.unique_views + EXCLUDED.unique_views;

  RETURN v_is_unique;
END;
$$ LANGUAGE plpgsql;


-- ===========================================================================
-- 4. Share hits
-- ===========================================================================
-- Hit counts for individual /share links, to spot mini-viral sharing.
-- Fed by the same /api/analytics/page-view call that records the 'share'
-- page view. Protected against flooding via:
--   - YouTube ID validation (app layer, before track_share_link is called)
--   - URL length cap (app layer)
--   - Per-table cap of 1,000 rows (enforced in track_share_link)
--   - Per-link hit count capped at 10,000
-- Rows are cleaned up 30 days after last_seen via the cron job.

CREATE TABLE IF NOT EXISTS share_hits (
  link_hash  TEXT PRIMARY KEY,   -- sha256 of the canonicalised (key-sorted) query string
  url        TEXT NOT NULL,
  hits       INTEGER NOT NULL DEFAULT 1,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast cleanup queries (cron deletes rows with last_seen older than 30 days)
CREATE INDEX IF NOT EXISTS idx_share_hits_last_seen
  ON share_hits(last_seen);

-- Index for dashboard queries (top hits descending)
CREATE INDEX IF NOT EXISTS idx_share_hits_hits
  ON share_hits(hits DESC);

ALTER TABLE share_hits ENABLE ROW LEVEL SECURITY;

-- Function: record a share link visit.
-- Always updates existing rows (capped at 10,000 hits).
-- Only inserts new rows when the table is under the 1,000-row cap.
-- The ON CONFLICT in the INSERT handles the rare race condition where two
-- concurrent requests both observe NOT FOUND and both attempt to insert.
CREATE OR REPLACE FUNCTION track_share_link(p_hash TEXT, p_url TEXT)
RETURNS void AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Always update if the link already exists
  UPDATE share_hits
  SET hits     = LEAST(hits + 1, 10000),
      last_seen = now()
  WHERE link_hash = p_hash;

  IF NOT FOUND THEN
    -- New link: only insert when under the row cap
    SELECT COUNT(*) INTO v_count FROM share_hits;
    IF v_count < 1000 THEN
      INSERT INTO share_hits (link_hash, url, hits, first_seen, last_seen)
      VALUES (p_hash, p_url, 1, now(), now())
      ON CONFLICT (link_hash) DO UPDATE
        SET hits      = LEAST(share_hits.hits + 1, 10000),
            last_seen = now();
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;
