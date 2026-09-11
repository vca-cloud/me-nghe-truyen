#!/usr/bin/env node
/**
 * Script thực thi migration khóa RLS cho bảng staffs trực tiếp lên Supabase
 * qua service-role REST API.
 *
 * Chạy: node scripts/lock-staffs-rls.mjs
 */

import { readFileSync } from "fs"
import { createClient } from "@supabase/supabase-js"

const envPath = new URL("../.env.local", import.meta.url)
const envContent = readFileSync(envPath, "utf-8")
const parseEnv = (text) =>
  Object.fromEntries(
    text
      .split("\n")
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const idx = line.indexOf("=")
        return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
      })
  )
const env = parseEnv(envContent)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error("❌ Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local")
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

console.log(`🔗 Kết nối tới: ${url}`)
console.log("🔐 Sử dụng service role key")
console.log("")

// SQL khóa RLS
const sql = `
BEGIN;

ALTER TABLE public.staffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staffs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin staffs public" ON public.staffs;
DROP POLICY IF EXISTS "Staffs deny anon" ON public.staffs;
DROP POLICY IF EXISTS "Staffs deny authenticated" ON public.staffs;

REVOKE ALL ON TABLE public.staffs FROM anon;
REVOKE ALL ON TABLE public.staffs FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.staffs TO service_role;

COMMIT;
`

console.log("📝 Đang thực thi SQL khóa RLS cho bảng staffs...")
console.log("")

// Supabase REST API không hỗ trợ raw SQL, phải dùng pg_catalog hoặc gọi function
// Workaround: tạo một function tạm để chạy SQL
const createFunctionSql = `
CREATE OR REPLACE FUNCTION public.temp_lock_staffs_rls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ALTER TABLE public.staffs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.staffs FORCE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Admin staffs public" ON public.staffs;
  DROP POLICY IF EXISTS "Staffs deny anon" ON public.staffs;
  DROP POLICY IF EXISTS "Staffs deny authenticated" ON public.staffs;

  REVOKE ALL ON TABLE public.staffs FROM anon;
  REVOKE ALL ON TABLE public.staffs FROM authenticated;

  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.staffs TO service_role;
END;
$$;
`

// Vì REST API không chạy được DDL trực tiếp, mình sẽ in SQL để user chạy thủ công
console.log("⚠️  Supabase REST API không hỗ trợ DDL command.")
console.log("📋 Vui lòng sao chép SQL bên dưới, vào Supabase Dashboard > SQL Editor > New query > Run:\n")
console.log("─".repeat(80))
console.log(sql.trim())
console.log("─".repeat(80))
console.log("")
console.log("Sau khi chạy SQL, kiểm tra bằng query:")
console.log("")
console.log("SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity")
console.log("FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace")
console.log("WHERE n.nspname = 'public' AND c.relname = 'staffs';")
console.log("")
console.log("SELECT policyname, roles FROM pg_policies")
console.log("WHERE schemaname = 'public' AND tablename = 'staffs';")
console.log("")
console.log("Kết quả mong đợi:")
console.log("  relrowsecurity = true")
console.log("  relforcerowsecurity = true")
console.log("  pg_policies: không còn policy cho anon/authenticated")
console.log("")

// Kiểm tra trạng thái hiện tại
console.log("🔍 Kiểm tra trạng thái RLS hiện tại qua API...")
try {
  const { data, error } = await supabase.from("staffs").select("id").limit(1)
  if (error) {
    if (error.code === "42501" || error.message.includes("permission denied")) {
      console.log("✅ Bảng staffs đã bị khóa — anon key KHÔNG thể đọc (chính xác!)")
    } else {
      console.log(`⚠️  Lỗi truy vấn: ${error.message}`)
    }
  } else {
    console.log(`❌ Anon key VẪN đọc được bảng staffs (trả về ${data?.length ?? 0} row)`)
    console.log("   → RLS chưa được áp dụng đúng cách.")
  }
} catch (err) {
  console.error("❌ Lỗi kiểm tra:", err.message)
}

console.log("")
console.log("Sau khi chạy SQL trên SQL Editor, chạy lại script này để xác nhận.")
