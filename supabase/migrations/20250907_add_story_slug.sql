-- Add stable URL slugs for story detail routes.
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill existing rows from their titles. The application also computes
-- slugs for legacy rows until this migration has been applied remotely.
