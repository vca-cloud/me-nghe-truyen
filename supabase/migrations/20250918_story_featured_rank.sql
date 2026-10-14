-- Vị trí ghim ở khu "Được nghe nhiều" trang chủ (1–4). NULL = không ghim; ô trống tự lấy theo lượt nghe.
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS featured_rank SMALLINT;
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_featured_rank_check;
ALTER TABLE public.stories ADD CONSTRAINT stories_featured_rank_check CHECK (featured_rank BETWEEN 1 AND 4);
