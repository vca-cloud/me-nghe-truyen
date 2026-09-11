-- Khóa bảng staffs: không cho anon/authenticated đọc password hay ghi dữ liệu.
-- CRUD chỉ đi qua service role (API /api/admin/staffs và /api/admin/login).

ALTER TABLE public.staffs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin staffs public" ON public.staffs;
DROP POLICY IF EXISTS "Staffs deny anon" ON public.staffs;
DROP POLICY IF EXISTS "Staffs deny authenticated" ON public.staffs;

REVOKE ALL ON TABLE public.staffs FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.staffs TO service_role;
