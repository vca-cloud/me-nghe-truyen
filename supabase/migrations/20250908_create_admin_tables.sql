-- Persist admin-managed categories and directory records.
CREATE TABLE IF NOT EXISTS public.categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  stories_count INTEGER NOT NULL DEFAULT 0,
  plays_count TEXT NOT NULL DEFAULT '0',
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  register DATE NOT NULL DEFAULT CURRENT_DATE,
  plays TEXT NOT NULL DEFAULT '0',
  package TEXT NOT NULL DEFAULT 'Free' CHECK (package IN ('Free', 'VIP')),
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staffs (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staffs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin categories public" ON public.categories;
CREATE POLICY "Admin categories public" ON public.categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admin users public" ON public.admin_users;
CREATE POLICY "Admin users public" ON public.admin_users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admin staffs public" ON public.staffs;
CREATE POLICY "Admin staffs public" ON public.staffs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.categories (name, slug)
VALUES ('Cổ trang', 'co-trang'), ('Truyện ma', 'truyen-ma'), ('Hiện đại', 'hien-dai')
ON CONFLICT DO NOTHING;

INSERT INTO public.admin_users (name, email, register, plays, package)
VALUES ('Nguyễn Minh Tâm', 'tam@example.com', '2025-01-15', '1.2M', 'VIP'), ('Lê Thu Hà', 'hanh@example.com', '2025-02-03', '890K', 'Free')
ON CONFLICT DO NOTHING;

INSERT INTO public.staffs (name, email, locked)
VALUES ('Admin', 'admin@mnghetruyen.com', false), ('Nguyễn Văn A', 'vana@mnghetruyen.com', false), ('Trần Thị B', 'thib@mnghetruyen.com', true)
ON CONFLICT DO NOTHING;
