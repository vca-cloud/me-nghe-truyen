import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { AUDIO_UNLOCK_COOKIE, isUnlocked } from "@/lib/audio-unlock"
import { createServiceDb } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

// Link audio không nằm trong HTML; chỉ lấy qua API khi người nghe bấm phát (nghe thử 60s, preview=1)
// hoặc sau khi đã bấm link affiliate (cookie ký bởi route click).
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const storyId = Number(params.get("storyId"))
  const preview = params.get("preview") === "1"
  if (!Number.isInteger(storyId) || storyId <= 0) return NextResponse.json({ error: "storyId không hợp lệ" }, { status: 400 })
  if (!preview && !isUnlocked((await cookies()).get(AUDIO_UNLOCK_COOKIE)?.value, storyId)) {
    return NextResponse.json({ error: "Cần mở khóa audio trước khi nghe." }, { status: 403 })
  }

  const db = createServiceDb()
  const [{ data: story }, { data: episodes }] = await Promise.all([
    db.from("stories").select("audio_url").eq("id", storyId).maybeSingle(),
    db.from("episodes").select("id, audio_url").eq("story_id", storyId),
  ])
  return NextResponse.json(
    { fallbackAudioUrl: story?.audio_url || null, episodes: (episodes ?? []).map((episode) => ({ id: episode.id, audio_url: episode.audio_url })) },
    { headers: { "Cache-Control": "private, no-store" } },
  )
}
