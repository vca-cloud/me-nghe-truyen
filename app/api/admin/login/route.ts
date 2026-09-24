import { NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS, createAdminSession } from "@/lib/admin-session"
import { createServiceDb } from "@/lib/admin-auth"
import { hashPassword, isHashedPassword, verifyPassword } from "@/lib/password"
import { clientIp } from "@/lib/request-ip"

const MAX_FAILURES = 5
const WINDOW_MS = 15 * 60 * 1000
// Bộ đếm theo instance; Vercel Fluid tái sử dụng instance nên đủ để làm chậm dò mật khẩu.
const failures = new Map<string, { count: number; resetAt: number }>()

function isBlocked(key: string) {
  const entry = failures.get(key)
  if (!entry || entry.resetAt < Date.now()) return false
  return entry.count >= MAX_FAILURES
}

function recordFailure(key: string) {
  const now = Date.now()
  const entry = failures.get(key)
  if (!entry || entry.resetAt < now) failures.set(key, { count: 1, resetAt: now + WINDOW_MS })
  else entry.count++
}

export async function POST(request: Request) {
  const { email, password } = await request.json().catch(() => ({}))
  if (!email || !password) return NextResponse.json({ error: "Vui lòng nhập email và mật khẩu." }, { status: 400 })

  const normalizedEmail = String(email).trim().toLowerCase()
  const ipKey = `ip:${clientIp(request)}`
  const emailKey = `email:${normalizedEmail}`
  if (isBlocked(ipKey) || isBlocked(emailKey)) {
    return NextResponse.json({ error: "Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút." }, { status: 429 })
  }

  let db
  try {
    db = createServiceDb()
  } catch {
    return NextResponse.json({ error: "Thiếu cấu hình Supabase server." }, { status: 500 })
  }

  const { data: staff, error } = await db.from("staffs").select("id, email, password, locked").eq("email", normalizedEmail).maybeSingle()
  if (error) return NextResponse.json({ error: "Không đăng nhập được, thử lại sau." }, { status: 500 })

  const ok = Boolean(staff) && !staff!.locked && await verifyPassword(String(password), String(staff!.password || ""))
  if (!ok) {
    recordFailure(ipKey)
    recordFailure(emailKey)
    return NextResponse.json({ error: "Email hoặc mật khẩu không đúng." }, { status: 401 })
  }

  failures.delete(ipKey)
  failures.delete(emailKey)
  if (!isHashedPassword(String(staff!.password))) {
    await db.from("staffs").update({ password: await hashPassword(String(password)) }).eq("id", staff!.id)
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_SESSION_COOKIE, await createAdminSession(staff!.email), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: ADMIN_SESSION_MAX_AGE_SECONDS })
  return response
}
