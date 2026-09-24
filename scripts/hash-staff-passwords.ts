// Mã hóa các mật khẩu staff còn lưu dạng chữ thường. Chạy SAU khi code dùng lib/password.ts đã deploy.
// npx tsx --env-file=.env.local scripts/hash-staff-passwords.ts
import { createClient } from "@supabase/supabase-js"
import { hashPassword, isHashedPassword } from "../lib/password"

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { data, error } = await db.from("staffs").select("id, password")
  if (error) throw error
  let updated = 0
  for (const staff of data ?? []) {
    const password = String(staff.password ?? "")
    if (!password || isHashedPassword(password)) continue
    const { error: updateError } = await db.from("staffs").update({ password: await hashPassword(password) }).eq("id", staff.id)
    if (updateError) throw updateError
    updated++
  }
  console.log(`Đã mã hóa ${updated}/${data?.length ?? 0} mật khẩu staff.`)
}

main().catch((error) => { console.error(error); process.exit(1) })
