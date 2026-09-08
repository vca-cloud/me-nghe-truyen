import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "Thiếu cấu hình Supabase." }, { status: 500 })

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  const [
    { data: stories, error: storiesError },
    { data: episodes, error: episodesError },
    { data: affiliateLinks, error: affiliateError },
  ] = await Promise.all([
    supabase.from("stories").select("*").order("id", { ascending: true }),
    supabase.from("episodes").select("*").order("story_id", { ascending: true }).order("episode_number", { ascending: true }),
    supabase.from("affiliate_links").select("*").order("id", { ascending: true }),
  ])

  if (storiesError || episodesError || affiliateError) {
    return NextResponse.json(
      { error: storiesError?.message || episodesError?.message || affiliateError?.message || "Không thể tạo bản sao lưu." },
      { status: 500 }
    )
  }

  const normalizedStories = (stories || []).map((story) => ({
    ...story,
    real_views: "real_views" in story ? story.real_views : 0,
    base_fake_views: "base_fake_views" in story ? story.base_fake_views : Number(story.plays || 0),
  }))

  const payload = {
    exported_at: new Date().toISOString(),
    stories: normalizedStories,
    episodes: episodes || [],
    affiliate_links: affiliateLinks || [],
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="me-nghe-truyen-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  })
}
