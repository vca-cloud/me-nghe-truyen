-- Member saved audio and listening history.
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id BIGINT NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, story_id)
);

CREATE TABLE IF NOT EXISTS public.listening_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id BIGINT NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  episode_id BIGINT REFERENCES public.episodes(id) ON DELETE CASCADE,
  progress_seconds NUMERIC NOT NULL DEFAULT 0 CHECK (progress_seconds >= 0),
  duration_seconds NUMERIC NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  last_played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_listening_history_user_episode ON public.listening_history(user_id, story_id, episode_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_user_time ON public.listening_history(user_id, last_played_at DESC);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own favorites" ON public.favorites;
CREATE POLICY "Users manage own favorites" ON public.favorites
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own listening history" ON public.listening_history;
CREATE POLICY "Users manage own listening history" ON public.listening_history
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
