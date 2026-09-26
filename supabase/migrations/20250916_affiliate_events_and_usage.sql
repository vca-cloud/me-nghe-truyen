-- Sự kiện affiliate: popup hiện (impression) và bấm link (click), gắn truyện + link.
-- visitor_hash là SHA-256 của IP + secret server, không lưu IP gốc.
CREATE TABLE IF NOT EXISTS public.affiliate_events (
  id BIGSERIAL PRIMARY KEY,
  event TEXT NOT NULL CHECK (event IN ('impression', 'click')),
  link_id BIGINT REFERENCES public.affiliate_links(id) ON DELETE SET NULL,
  story_id BIGINT REFERENCES public.stories(id) ON DELETE SET NULL,
  visitor_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_affiliate_events_created_at ON public.affiliate_events (created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_events_event_time ON public.affiliate_events (event, created_at);
ALTER TABLE public.affiliate_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Affiliate events service access" ON public.affiliate_events;
CREATE POLICY "Affiliate events service access" ON public.affiliate_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Dung lượng database, Supabase Storage và các bảng lớn nhất cho dashboard admin.
CREATE OR REPLACE FUNCTION public.admin_system_usage()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, storage, pg_catalog
AS $$
  SELECT json_build_object(
    'database_bytes', pg_database_size(current_database()),
    'storage_bytes', COALESCE((SELECT SUM((metadata->>'size')::BIGINT) FROM storage.objects), 0),
    'storage_objects', (SELECT COUNT(*) FROM storage.objects),
    'tables', COALESCE((
      SELECT json_agg(t) FROM (
        SELECT c.relname AS name, pg_total_relation_size(c.oid) AS bytes
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r'
        ORDER BY pg_total_relation_size(c.oid) DESC
        LIMIT 8
      ) t
    ), '[]'::JSON)
  );
$$;

REVOKE ALL ON FUNCTION public.admin_system_usage() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_system_usage() TO service_role;
