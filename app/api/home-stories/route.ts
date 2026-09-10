import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const revalidate = 60 // Cache 60 giây
export const dynamic = "force-static"

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    return NextResponse.json({ error: "Thiếu cấu hình Supabase server." }, { status: 500 })
  }

  try {
    const db = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await db
      .from("stories")
      .select("id, title, author, genre, description, audio_url, cover_url, episodes, duration, plays, real_views, base_fake_views, status")
      .order("id", { ascending: false })

    if (error) throw error

    return NextResponse.json({ stories: data || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không tải được dữ liệu" },
      { status: 500 }
    )
  }
}
