import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/supabase-server"

export async function GET(request: Request) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error || !user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 })
  const params = new URL(request.url).searchParams
  const storyId = params.get("storyId")
  const episodeId = params.get("episodeId")
  let query = supabase
    .from("listening_history")
    .select("*, stories(id, title, cover_url), episodes(id, episode_number, title, duration)")
    .eq("user_id", user.id)
    .order("last_played_at", { ascending: false })
  if (storyId && Number.isInteger(Number(storyId))) query = query.eq("story_id", Number(storyId))
  if (episodeId && Number.isInteger(Number(episodeId))) query = query.eq("episode_id", Number(episodeId))
  const { data, error: queryError } = await query
  if (queryError) return NextResponse.json({ error: queryError.message }, { status: 500 })
  return NextResponse.json({ history: data || [] })
}

export async function PUT(request: Request) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error || !user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const storyId = Number(body?.storyId)
  const episodeId = body?.episodeId == null ? null : Number(body.episodeId)
  const progress = Number(body?.progressSeconds)
  const duration = Number(body?.durationSeconds)
  if (!Number.isInteger(storyId) || storyId <= 0 || (episodeId !== null && (!Number.isInteger(episodeId) || episodeId <= 0))) {
    return NextResponse.json({ error: "storyId hoặc episodeId không hợp lệ." }, { status: 400 })
  }
  if (!Number.isFinite(progress) || progress < 0 || !Number.isFinite(duration) || duration < 0) {
    return NextResponse.json({ error: "Tiến trình audio không hợp lệ." }, { status: 400 })
  }
  const safeProgress = duration > 0 ? Math.min(progress, duration) : progress
  const completed = Boolean(body?.completed) || (duration > 0 && safeProgress >= duration * 0.9)
  const query = supabase.from("listening_history").upsert({
    user_id: user.id, story_id: storyId, episode_id: episodeId,
    progress_seconds: safeProgress, duration_seconds: duration, completed,
    last_played_at: new Date().toISOString(),
  }, { onConflict: "user_id,story_id,episode_id" })
  const { error: saveError } = await query
  if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
