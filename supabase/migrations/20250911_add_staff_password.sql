ALTER TABLE public.staffs ADD COLUMN IF NOT EXISTS password TEXT;

UPDATE public.staffs
SET password = COALESCE(password, 'admin123')
WHERE password IS NULL;

ALTER TABLE public.staffs ALTER COLUMN password SET NOT NULL;
