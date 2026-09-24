import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { clientIp } from "@/lib/request-ip"

const DEDUPE_WINDOW_MS = 30 * 60 * 1000

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const storyId = Number(body?.storyId)
    if (!Number.isInteger(storyId) || storyId <= 0) {
      return NextResponse.json({ error: "storyId không hợp lệ" }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRoleKey) {
      return NextResponse.json({ error: "Thiếu cấu hình Supabase server" }, { status: 500 })
    }

    const db = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const ip = clientIp(request)

    const rpc = await db.rpc("record_story_listen", { p_story_id: storyId, p_ip: ip, p_window_minutes: DEDUPE_WINDOW_MS / 60000 })
    if (!rpc.error) {
      if (rpc.data === null) return NextResponse.json({ error: "Không tìm thấy truyện" }, { status: 404 })
      return NextResponse.json({ ok: true, counted: rpc.data === true })
    }
    // Hàm SQL chưa được tạo (chưa chạy migration 20250915): dùng cách cũ.
    if (rpc.error.code !== "PGRST202" && rpc.error.code !== "42883") throw rpc.error

    const since = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString()
    const { count } = await db
      .from("listener_logs")
      .select("id", { count: "exact", head: true })
      .eq("ip_address", ip)
      .eq("story_id", storyId)
      .gte("created_at", since)
    if (count && count > 0) return NextResponse.json({ ok: true, counted: false })

    const { data: story, error: storyError } = await db.from("stories").select("real_views").eq("id", storyId).maybeSingle()
    if (storyError || !story) return NextResponse.json({ error: "Không tìm thấy truyện" }, { status: 404 })

    await db.from("listener_logs").insert({ ip_address: ip, story_id: storyId, created_at: new Date().toISOString() })
    await db.from("stories").update({ real_views: Number(story.real_views || 0) + 1 }).eq("id", storyId)
    return NextResponse.json({ ok: true, counted: true })
  } catch (error) {
    console.error("increment-views:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Không thể cập nhật lượt nghe" }, { status: 500 })
  }
}
