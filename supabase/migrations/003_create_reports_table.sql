-- Migration 003: Create ambiance_reports table
-- Allows logged-in users to report published ambiances (broken link, other).
-- Anti-spam: capped per-user; shadowbanned users get false positives.
-- All DB operations go through the admin client (service role key) which bypasses RLS.

CREATE TABLE IF NOT EXISTS ambiance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambiance_id VARCHAR(12) NOT NULL REFERENCES ambiances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL
    REFERENCES public.users(id) ON DELETE CASCADE,
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('broken', 'other')),
  message VARCHAR(300) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_ambiance_reports_pending_unique
  ON ambiance_reports(ambiance_id, user_id) WHERE status = 'pending';

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

CREATE OR REPLACE FUNCTION public.submit_ambiance_report(
  p_user_id UUID,
  p_ambiance_id VARCHAR(12),
  p_report_type VARCHAR(20),
  p_message TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  reporter_status TEXT;
BEGIN
  SELECT account_status INTO reporter_status
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF reporter_status = 'shadowbanned' THEN
    RETURN TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.ambiances
    WHERE id = p_ambiance_id AND status = 'published'
  ) THEN
    RETURN FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.ambiance_reports
    WHERE ambiance_id = p_ambiance_id AND user_id = p_user_id
      AND status = 'pending'
  ) AND (
    SELECT count(*) FROM public.ambiance_reports
    WHERE user_id = p_user_id AND status = 'pending'
  ) >= 5 THEN
    RETURN TRUE;
  END IF;

  INSERT INTO public.ambiance_reports (
    ambiance_id, user_id, report_type, message
  ) VALUES (
    p_ambiance_id, p_user_id, p_report_type,
    CASE WHEN p_report_type = 'other' THEN left(trim(p_message), 200) ELSE '' END
  )
  ON CONFLICT (ambiance_id, user_id) WHERE status = 'pending'
  DO UPDATE SET report_type = EXCLUDED.report_type, message = EXCLUDED.message;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_ambiance_report(UUID, VARCHAR, VARCHAR, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_ambiance_report(UUID, VARCHAR, VARCHAR, TEXT)
  TO service_role;
