-- Migration 003: Create ambiance_reports table
-- Allows logged-in users to report published ambiances (broken link, other).
-- Anti-spam: capped per-user; shadowbanned users get false positives (handled in app code).
-- All DB operations go through the admin client (service role key) which bypasses RLS.

CREATE TABLE IF NOT EXISTS ambiance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambiance_id VARCHAR(12) NOT NULL REFERENCES ambiances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL
    REFERENCES public.users(id) ON DELETE CASCADE,
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('broken', 'other')),
  message VARCHAR(300) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ambiance_id, user_id)
);

-- Index for admin review: fetch all pending reports
CREATE INDEX idx_ambiance_reports_status ON ambiance_reports(status);

-- Index for per-user report count (anti-spam check)
CREATE INDEX idx_ambiance_reports_user_id ON ambiance_reports(user_id);

-- Index for looking up reports by ambiance
CREATE INDEX idx_ambiance_reports_ambiance_id ON ambiance_reports(ambiance_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE ambiance_reports ENABLE ROW LEVEL SECURITY;

-- No direct access via public client (all handled by admin client)
