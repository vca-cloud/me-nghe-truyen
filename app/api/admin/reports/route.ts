import { NextResponse } from "next/server"
import { createServiceDb, hasAdminSession } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

const SELECT = "id, story_id, episode_id, kind, message, contact, detail, page_url, user_agent, auto, status, created_at, resolved_at, stories(id, title), episodes(id, episode_number, title, audio_url)"

// GET ?status=new|resolved|all (mặc định new) — 300 báo lỗi mới nhất; ?count=1 chỉ trả số chưa xử lý.
export async function GET(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const db = createServiceDb()
  const params = new URL(request.url).searchParams

  const { count: openCount, error: countError } = await db.from("issue_reports").select("id", { count: "exact", head: true }).eq("status", "new")
  if (countError) return NextResponse.json({ error: countError.message, missingTable: /issue_reports/.test(countError.message) }, { status: 500 })
  if (params.get("count")) return NextResponse.json({ open: openCount ?? 0 })

  const status = params.get("status") || "new"
  let query = db.from("issue_reports").select(SELECT).order("created_at", { ascending: false }).limit(300)
  if (status === "new" || status === "resolved") query = query.eq("status", status)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ open: openCount ?? 0, reports: data || [] })
}

// PATCH { ids: number[], status: "new" | "resolved" } — đánh dấu đã xử lý / mở lại.
export async function PATCH(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const ids = Array.isArray(body?.ids) ? body.ids.map(Number).filter((id: number) => Number.isInteger(id) && id > 0).slice(0, 500) : []
  const status = body?.status
  if (!ids.length || (status !== "new" && status !== "resolved")) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 })
  const { error } = await createServiceDb().from("issue_reports")
    .update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null })
    .in("id", ids)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE ?id= — xóa báo lỗi rác.
export async function DELETE(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = Number(new URL(request.url).searchParams.get("id"))
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id không hợp lệ." }, { status: 400 })
  const { error } = await createServiceDb().from("issue_reports").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
