import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createClient } from "@supabase/supabase-js"
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-session"

export const dynamic = "force-dynamic"

export async function DELETE(request: Request) {
  const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!(await isValidAdminSession(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    return NextResponse.json({ error: "Thiếu cấu hình Supabase server." }, { status: 500 })
  }

  const body = await request.json().catch(() => ({}))
  const storyId = Number(body?.id)
  if (!Number.isInteger(storyId) || storyId <= 0) {
    return NextResponse.json({ error: "id truyện không hợp lệ" }, { status: 400 })
  }

  const db = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error: episodesError } = await db.from("episodes").delete().eq("story_id", storyId)
  if (episodesError) {
    return NextResponse.json({ error: episodesError.message }, { status: 500 })
  }

  const { error: storyError } = await db.from("stories").delete().eq("id", storyId)
  if (storyError) {
    return NextResponse.json({ error: storyError.message }, { status: 500 })
  }

  revalidatePath("/")
  revalidatePath("/admin/audio")
  revalidatePath("/track", "layout")

  return NextResponse.json({ ok: true })
}
