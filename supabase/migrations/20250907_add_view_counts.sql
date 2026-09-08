-- Add base_fake_views and real_views columns to stories table
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS base_fake_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS real_views INTEGER DEFAULT 0;

-- Backfill: Convert existing plays to base_fake_views
UPDATE public.stories
SET base_fake_views = CASE
  WHEN plays ~ '^[0-9]+$' THEN CAST(plays AS INTEGER)
  ELSE 0
END
WHERE base_fake_views = 0 OR base_fake_views IS NULL;

-- Set random values for stories with 0 views
UPDATE public.stories
SET base_fake_views = FLOOR(1500 + RANDOM() * 13500)::INTEGER
WHERE base_fake_views = 0 OR base_fake_views IS NULL;
