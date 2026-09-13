import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/supabase-server"

function storyIdFrom(request: Request) {
  const value = Number(new URL(request.url).searchParams.get("storyId"))
  return Number.isInteger(value) && value > 0 ? value : null
}

export async function GET(request: Request) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error || !user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 })
  const storyId = new URL(request.url).searchParams.get("storyId")
  if (storyId) {
    const id = Number(storyId)
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "storyId không hợp lệ." }, { status: 400 })
    const { data, error: queryError } = await supabase.from("favorites").select("story_id").eq("user_id", user.id).eq("story_id", id).maybeSingle()
    if (queryError) return NextResponse.json({ error: queryError.message }, { status: 500 })
    return NextResponse.json({ saved: Boolean(data) })
  }
  const { data, error: queryError } = await supabase
    .from("favorites").select("story_id, created_at, stories(*)").eq("user_id", user.id).order("created_at", { ascending: false })
  if (queryError) return NextResponse.json({ error: queryError.message }, { status: 500 })
  return NextResponse.json({ favorites: data || [] })
}

export async function POST(request: Request) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error || !user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const storyId = Number(body?.storyId)
  if (!Number.isInteger(storyId) || storyId <= 0) return NextResponse.json({ error: "storyId không hợp lệ." }, { status: 400 })
  const { error: insertError } = await supabase.from("favorites").upsert({ user_id: user.id, story_id: storyId }, { onConflict: "user_id,story_id" })
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  return NextResponse.json({ ok: true, saved: true })
}

export async function DELETE(request: Request) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error || !user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 })
  const storyId = storyIdFrom(request)
  if (!storyId) return NextResponse.json({ error: "storyId không hợp lệ." }, { status: 400 })
  const { error: deleteError } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("story_id", storyId)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  return NextResponse.json({ ok: true, saved: false })
}
