import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === "object" && "message" in error) return String((error as { message?: unknown }).message)
  return "Không thể cập nhật lượt nghe"
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
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

    // Lấy IP từ request
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Lưu log lượt nghe
    await db.from("listener_logs").insert({
      ip_address: ip,
      story_id: storyId,
      created_at: new Date().toISOString()
    })

    // Cập nhật real_views
    const modern = await db.from("stories").select("real_views").eq("id", storyId).single()
    if (!modern.error) {
      await db.from("stories").update({ real_views: Number(modern.data?.real_views || 0) + 1 }).eq("id", storyId)
      return NextResponse.json({ ok: true, field: "real_views", ip })
    }

    // Compatibility cho DB cũ
    const legacy = await db.from("stories").select("plays").eq("id", storyId).single()
    await db.from("stories").update({ plays: String(Number(legacy.data?.plays || 0) + 1) }).eq("id", storyId)
    return NextResponse.json({ ok: true, field: "plays", migrationRequired: true, ip })
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
