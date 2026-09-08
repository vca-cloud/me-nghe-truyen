-- =============================================
-- MIGRATION BƯỚC 3: affiliate_links
-- Chạy 1 lần trong Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  shoppe_url TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "affiliate_links public" ON public.affiliate_links;
CREATE POLICY "affiliate_links public"
  ON public.affiliate_links
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Seed link hiện tại
INSERT INTO public.affiliate_links (title, shoppe_url, image_url, is_active)
VALUES (
  'Mê Nghe Truyện - Mở khóa audio',
  'https://s.shopee.vn/8KpKUtkEPo',
  'https://pub-b9073049650e4965b2047af671bd9dc2.r2.dev/affiliate/me-nghe-truyen.jpg',
  true
)
ON CONFLICT DO NOTHING;

-- Tạo RPC tăng clicks nguyên tử
CREATE OR REPLACE FUNCTION public.increment_affiliate_click(link_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
  current_clicks INTEGER;
BEGIN
  SELECT clicks INTO current_clicks FROM affiliate_links WHERE id = link_id;
  IF current_clicks IS NULL THEN
    RAISE EXCEPTION 'Link không tồn tại';
  END IF;
  UPDATE affiliate_links
  SET clicks = clicks + 1, updated_at = NOW()
  WHERE id = link_id
  RETURNING clicks INTO current_clicks;
  RETURN current_clicks;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_affiliate_click(BIGINT) TO anon, authenticated, service_role;
