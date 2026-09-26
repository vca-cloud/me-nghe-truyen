import { NextResponse } from "next/server"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { clientIp } from "@/lib/request-ip"
import { visitorHash } from "@/lib/visitor"

function createDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

const CLICK_WINDOW_MS = 10 * 60 * 1000
// Chặn một IP cộng click liên tục cho cùng link (bộ nhớ theo instance).
const recentClicks = new Map<string, number>()

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const linkId = Number(id)
    if (!Number.isInteger(linkId) || linkId <= 0) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 })
    }

    const now = Date.now()
    const clickKey = `${clientIp(request)}:${linkId}`
    if ((recentClicks.get(clickKey) ?? 0) > now - CLICK_WINDOW_MS) return NextResponse.json({ ok: true, counted: false })
    recentClicks.set(clickKey, now)
    if (recentClicks.size > 5000) {
      for (const [key, at] of recentClicks) if (at <= now - CLICK_WINDOW_MS) recentClicks.delete(key)
    }

    const db = createDb()
    if (!db) {
      return NextResponse.json({ error: "Thiếu cấu hình Supabase" }, { status: 500 })
    }

    const body = await request.json().catch(() => null)
    const storyId = Number(body?.storyId)
    const { error: eventError } = await db.from("affiliate_events").insert({
      event: "click",
      link_id: linkId,
      story_id: Number.isInteger(storyId) && storyId > 0 ? storyId : null,
      visitor_hash: visitorHash(request),
    })
    if (eventError) console.warn("affiliate_events click:", eventError.message)

    const { data, error } = await db.rpc("increment_affiliate_click", { link_id: linkId })
    if (!error) {
      return NextResponse.json({ ok: true, clicks: data })
    }

    const { data: link, error: readError } = await db
      .from("affiliate_links")
      .select("id, clicks, is_active")
      .eq("id", linkId)
      .single()
    if (readError) throw readError
    if (!link?.is_active) {
      return NextResponse.json({ error: "Link affiliate đang tắt" }, { status: 400 })
    }

    const nextClicks = Number(link.clicks || 0) + 1
    const { error: updateError } = await db
      .from("affiliate_links")
      .update({ clicks: nextClicks, updated_at: new Date().toISOString() })
      .eq("id", linkId)
    if (updateError) throw updateError
    return NextResponse.json({ ok: true, clicks: nextClicks })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tăng clicks"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
