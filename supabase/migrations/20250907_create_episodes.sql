-- Multi-episode audio support.
CREATE TABLE IF NOT EXISTS public.episodes (
  id BIGSERIAL PRIMARY KEY,
  story_id BIGINT NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL CHECK (episode_number > 0),
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration TEXT DEFAULT '0h 0m',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (story_id, episode_number)
);

ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Episodes are public" ON public.episodes;
CREATE POLICY "Episodes are public" ON public.episodes
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);
