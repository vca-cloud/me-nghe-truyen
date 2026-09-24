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
