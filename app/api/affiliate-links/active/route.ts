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

export async function GET() {
  try {
    const db = createDb()
    if (!db) {
      return NextResponse.json({ error: "Thiếu cấu hình Supabase" }, { status: 500 })
    }

    const { data, error } = await db
      .from("affiliate_links")
      .select("id, title, shoppe_url, image_url, is_active, clicks")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) throw error
    return NextResponse.json({ link: data?.[0] || null })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể lấy link affiliate"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
