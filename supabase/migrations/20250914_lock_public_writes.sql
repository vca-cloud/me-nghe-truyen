-- Khách (anon/authenticated) chỉ được ĐỌC nội dung công khai.
-- Mọi thao tác ghi của admin đi qua /api/admin/db (kiểm tra admin_session + service role).
-- Chỉ chạy SAU KHI bản code có /api/admin/db đã deploy lên production.

-- stories
DROP POLICY IF EXISTS "Stories are public" ON public.stories;
DROP POLICY IF EXISTS "Allow anon select stories" ON public.stories;
DROP POLICY IF EXISTS "Allow anon insert stories" ON public.stories;
DROP POLICY IF EXISTS "Allow anon update stories" ON public.stories;
DROP POLICY IF EXISTS "Allow anon delete stories" ON public.stories;
DROP POLICY IF EXISTS "Stories readable by everyone" ON public.stories;
CREATE POLICY "Stories readable by everyone" ON public.stories
  FOR SELECT TO anon, authenticated USING (true);

-- episodes
DROP POLICY IF EXISTS "Episodes are public" ON public.episodes;
DROP POLICY IF EXISTS "Episodes readable by everyone" ON public.episodes;
CREATE POLICY "Episodes readable by everyone" ON public.episodes
  FOR SELECT TO anon, authenticated USING (true);

-- categories
DROP POLICY IF EXISTS "Admin categories public" ON public.categories;
DROP POLICY IF EXISTS "Categories readable by everyone" ON public.categories;
CREATE POLICY "Categories readable by everyone" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);

-- affiliate_links
DROP POLICY IF EXISTS "affiliate_links public" ON public.affiliate_links;
DROP POLICY IF EXISTS "Affiliate links readable by everyone" ON public.affiliate_links;
CREATE POLICY "Affiliate links readable by everyone" ON public.affiliate_links
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
