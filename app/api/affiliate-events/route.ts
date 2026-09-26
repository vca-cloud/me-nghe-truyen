import { NextResponse } from "next/server"
import { createServiceDb } from "@/lib/admin-auth"
import { visitorHash } from "@/lib/visitor"

const IMPRESSION_WINDOW_MS = 60 * 1000
// Một người mở popup nhiều lần liên tục chỉ tính 1 lần hiển thị mỗi phút (bộ nhớ theo instance).
const recent = new Map<string, number>()

function positiveInt(value: unknown) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (body?.event !== "impression") return NextResponse.json({ error: "Sự kiện không hợp lệ" }, { status: 400 })
  const linkId = positiveInt(body.linkId)
  const storyId = positiveInt(body.storyId)
  const visitor = visitorHash(request)

  const now = Date.now()
  const key = `${visitor}:${linkId}:${storyId}`
  if ((recent.get(key) ?? 0) > now - IMPRESSION_WINDOW_MS) return NextResponse.json({ ok: true, counted: false })
  recent.set(key, now)
  if (recent.size > 5000) for (const [k, at] of recent) if (at <= now - IMPRESSION_WINDOW_MS) recent.delete(k)

  const { error } = await createServiceDb().from("affiliate_events").insert({ event: "impression", link_id: linkId, story_id: storyId, visitor_hash: visitor })
  if (error) console.warn("affiliate_events impression:", error.message)
  return NextResponse.json({ ok: true, counted: !error })
}
