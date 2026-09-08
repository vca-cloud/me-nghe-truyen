import { NextResponse } from "next/server"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

function createDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const linkId = Number(id)
    if (!Number.isInteger(linkId) || linkId <= 0) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 })
    }

    const db = createDb()
    if (!db) {
      return NextResponse.json({ error: "Thiếu cấu hình Supabase" }, { status: 500 })
    }

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
