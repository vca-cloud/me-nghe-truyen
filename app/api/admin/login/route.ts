import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { ADMIN_SESSION_COOKIE, createAdminSession } from "@/lib/admin-session"

export async function POST(request: Request) {
  const { email, password } = await request.json().catch(() => ({}))
  if (!email || !password) return NextResponse.json({ error: "Vui lòng nhập email và mật khẩu." }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ error: "Thiếu cấu hình Supabase server." }, { status: 500 })

  const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: staff, error } = await db.from("staffs").select("email, password, locked").eq("email", String(email).trim().toLowerCase()).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!staff || staff.locked || staff.password !== password) return NextResponse.json({ error: "Email hoặc mật khẩu không đúng." }, { status: 401 })

  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_SESSION_COOKIE, await createAdminSession(staff.email), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 })
  return response
}
