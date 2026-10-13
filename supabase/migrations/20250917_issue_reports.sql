-- Báo lỗi từ người nghe (bấm "Báo lỗi") và lỗi audio tự ghi nhận từ player (auto = true).
-- Chỉ service_role đọc/ghi: người nghe gửi qua /api/report-issue, admin xem qua /api/admin/reports.
CREATE TABLE IF NOT EXISTS public.issue_reports (
  id BIGSERIAL PRIMARY KEY,
  story_id BIGINT REFERENCES public.stories(id) ON DELETE CASCADE,
  episode_id BIGINT REFERENCES public.episodes(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('cannot_play', 'bad_audio', 'wrong_content', 'slow', 'popup', 'other', 'audio_error')),
  message TEXT CHECK (char_length(message) <= 1000),
  contact TEXT CHECK (char_length(contact) <= 200),
  detail TEXT CHECK (char_length(detail) <= 500),
  page_url TEXT CHECK (char_length(page_url) <= 500),
  user_agent TEXT CHECK (char_length(user_agent) <= 300),
  visitor_hash TEXT NOT NULL,
  user_id UUID,
  auto BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_issue_reports_status_time ON public.issue_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_reports_story ON public.issue_reports (story_id);
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Issue reports service access" ON public.issue_reports;
CREATE POLICY "Issue reports service access" ON public.issue_reports FOR ALL TO service_role USING (true) WITH CHECK (true);
REVOKE ALL ON public.issue_reports FROM anon, authenticated;
