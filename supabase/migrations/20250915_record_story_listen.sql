-- Production chưa từng chạy 20250910_create_listener_logs.sql, nên tạo bảng ở đây (idempotent).
CREATE TABLE IF NOT EXISTS public.listener_logs (
  id BIGSERIAL PRIMARY KEY,
  ip_address TEXT NOT NULL,
  story_id BIGINT NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_listener_logs_story_id ON public.listener_logs(story_id);
CREATE INDEX IF NOT EXISTS idx_listener_logs_created_at ON public.listener_logs(created_at);
ALTER TABLE public.listener_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Listener logs service access" ON public.listener_logs;
CREATE POLICY "Listener logs service access" ON public.listener_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Ghi nhận một lượt nghe nguyên tử: chống trùng theo IP + truyện trong p_window_minutes,
-- ghi listener_logs và cộng real_views trong cùng một transaction.
-- Trả về: true = đã cộng, false = trùng trong cửa sổ, NULL = không có truyện.
CREATE OR REPLACE FUNCTION public.record_story_listen(p_story_id BIGINT, p_ip TEXT, p_window_minutes INT DEFAULT 30)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_ip || ':' || p_story_id::TEXT));

  IF NOT EXISTS (SELECT 1 FROM stories WHERE id = p_story_id) THEN
    RETURN NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM listener_logs
    WHERE ip_address = p_ip
      AND story_id = p_story_id
      AND created_at > NOW() - make_interval(mins => p_window_minutes)
  ) THEN
    RETURN FALSE;
  END IF;

  INSERT INTO listener_logs (ip_address, story_id, created_at) VALUES (p_ip, p_story_id, NOW());
  UPDATE stories SET real_views = COALESCE(real_views, 0) + 1 WHERE id = p_story_id;
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.record_story_listen(BIGINT, TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_story_listen(BIGINT, TEXT, INT) TO service_role;

CREATE INDEX IF NOT EXISTS idx_listener_logs_ip_story_time ON public.listener_logs (ip_address, story_id, created_at DESC);
