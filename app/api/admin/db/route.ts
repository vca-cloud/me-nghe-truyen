import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createClient } from "@supabase/supabase-js"
import { hasAdminSession } from "@/lib/admin-session"
import { ADMIN_WRITABLE_TABLES, type AdminWriteRequest } from "@/lib/admin-db"

type Match = Record<string, string | number | boolean>

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function validMatch(value: unknown): value is Match {
  return isPlainObject(value) && Object.keys(value).length > 0 &&
    Object.entries(value).every(([key, v]) => /^[a-z_]+$/.test(key) && ["string", "number", "boolean"].includes(typeof v))
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ data: null, error: { message: "Unauthorized" } }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ data: null, error: { message: "Thiếu cấu hình Supabase server." } }, { status: 500 })

  const body = (await request.json().catch(() => null)) as AdminWriteRequest | null
  if (!body || !(ADMIN_WRITABLE_TABLES as readonly string[]).includes(body.table)) {
    return NextResponse.json({ data: null, error: { message: "Bảng không hợp lệ." } }, { status: 400 })
  }
  if ((body.op === "update" || body.op === "delete") && !validMatch(body.match)) {
    return NextResponse.json({ data: null, error: { message: "Thiếu điều kiện cập nhật/xóa." } }, { status: 400 })
  }

  const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  const table = db.from(body.table)

  let query
  if (body.op === "insert") {
    if (!isPlainObject(body.values) && !(Array.isArray(body.values) && body.values.every(isPlainObject))) {
      return NextResponse.json({ data: null, error: { message: "Dữ liệu không hợp lệ." } }, { status: 400 })
    }
    query = table.insert(body.values)
  } else if (body.op === "update") {
    if (!isPlainObject(body.values)) return NextResponse.json({ data: null, error: { message: "Dữ liệu không hợp lệ." } }, { status: 400 })
    query = table.update(body.values).match(body.match as Match)
  } else if (body.op === "delete") {
    query = table.delete().match(body.match as Match)
  } else {
    return NextResponse.json({ data: null, error: { message: "Thao tác không hợp lệ." } }, { status: 400 })
  }

  const { data, error } = body.select ? await query.select() : await query
  if (error) return NextResponse.json({ data: null, error: { message: error.message } }, { status: 400 })

  revalidatePath("/")
  revalidatePath("/api/home-stories")
  revalidatePath("/track/[slug]", "page")

  return NextResponse.json({ data: data ?? null, error: null })
}
