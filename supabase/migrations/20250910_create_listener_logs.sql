CREATE TABLE IF NOT EXISTS public.listener_logs (
  id BIGSERIAL PRIMARY KEY,
  ip_address TEXT NOT NULL,
  story_id BIGINT NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listener_logs_ip_address ON public.listener_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_listener_logs_story_id ON public.listener_logs(story_id);
CREATE INDEX IF NOT EXISTS idx_listener_logs_created_at ON public.listener_logs(created_at);

ALTER TABLE public.listener_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Listener logs service access" ON public.listener_logs;
CREATE POLICY "Listener logs service access" ON public.listener_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
