-- migrations/20250906_create_stories_table.sql

CREATE TABLE IF NOT EXISTS public.stories (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  genre TEXT,
  description TEXT,
  audio_url TEXT,
  cover_url TEXT,
  episodes INTEGER DEFAULT 1,
  duration TEXT DEFAULT '0h 0m',
  plays TEXT DEFAULT '0',
  status TEXT DEFAULT 'Đang cập nhật',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thêm RLS policy (bạn có thể comment nếu không dùng auth)
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stories are public" ON public.stories
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);