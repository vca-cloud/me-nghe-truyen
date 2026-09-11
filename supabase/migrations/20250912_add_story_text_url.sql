-- Optional link to the corresponding written story.
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS text_url TEXT;
