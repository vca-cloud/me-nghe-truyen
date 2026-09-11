import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-session"

export const dynamic = "force-dynamic"

type StaffInput = { name?: unknown; email?: unknown; password?: unknown; locked?: unknown }

async function getDb() {
  const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!(await isValidAdminSession(session))) return null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Thiếu cấu hình Supabase server.")
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function publicStaff(staff: Record<string, unknown>) {
  return { id: staff.id, name: staff.name, email: staff.email, locked: staff.locked }
}

export async function GET() {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { data, error } = await db.from("staffs").select("id, name, email, locked").order("id")
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ staffs: (data || []).map(publicStaff) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json().catch(() => ({})) as StaffInput
    const name = String(body.name || "").trim()
    const email = String(body.email || "").trim().toLowerCase()
    const password = String(body.password || "").trim()
    if (!name || !email || !password) return NextResponse.json({ error: "Vui lòng nhập tên, email và mật khẩu." }, { status: 400 })
    const { data, error } = await db.from("staffs").insert({ name, email, password }).select("id, name, email, locked").single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ staff: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json().catch(() => ({})) as StaffInput & { id?: unknown }
    const id = Number(body.id)
    const name = String(body.name || "").trim()
    const email = String(body.email || "").trim().toLowerCase()
    if (!Number.isInteger(id) || id <= 0 || !name || !email) return NextResponse.json({ error: "Thông tin quản trị viên không hợp lệ." }, { status: 400 })
    const updates: StaffInput = { name, email }
    if (String(body.password || "").trim()) updates.password = String(body.password).trim()
    if (typeof body.locked === "boolean") updates.locked = body.locked
    const { data, error } = await db.from("staffs").update(updates).eq("id", id).select("id, name, email, locked").single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ staff: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json().catch(() => ({})) as { id?: unknown }
    const id = Number(body.id)
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "ID không hợp lệ." }, { status: 400 })
    const { error } = await db.from("staffs").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
  }
}
