import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { ADMIN_SESSION_COOKIE, readAdminSession } from "@/lib/admin-session"

export function createServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Thiếu cấu hình Supabase server.")
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// Kiểm tra cả chữ ký cookie lẫn trạng thái staff hiện tại, để khóa/xóa staff có hiệu lực ngay.
export async function hasAdminSession() {
  const session = await readAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value)
  if (!session) return false
  const { data, error } = await createServiceDb().from("staffs").select("locked").eq("email", session.email).maybeSingle()
  return !error && Boolean(data) && !data?.locked
}
