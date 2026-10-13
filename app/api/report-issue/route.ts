import { NextResponse } from "next/server"
import { createServiceDb } from "@/lib/admin-auth"
import { isIssueKind } from "@/lib/issue-reports"
import { getAuthenticatedUser } from "@/lib/supabase-server"
import { visitorHash } from "@/lib/visitor"

const MANUAL_WINDOW_MS = 10 * 60 * 1000
const MANUAL_LIMIT = 5
const AUTO_WINDOW_MS = 30 * 60 * 1000
// Chống spam theo instance: tối đa 5 báo lỗi tay / 10 phút / người; lỗi tự ghi nhận 1 lần / 30 phút / người + tập.
const manualHits = new Map<string, number[]>()
const autoHits = new Map<string, number>()

function positiveInt(value: unknown) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

function text(value: unknown, max: number) {
  const result = typeof value === "string" ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max) : ""
  return result || null
}

function prune(now: number) {
  if (manualHits.size > 5000) for (const [key, hits] of manualHits) if (hits.every((at) => at <= now - MANUAL_WINDOW_MS)) manualHits.delete(key)
  if (autoHits.size > 5000) for (const [key, at] of autoHits) if (at <= now - AUTO_WINDOW_MS) autoHits.delete(key)
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || !isIssueKind(body.kind)) return NextResponse.json({ error: "Loại lỗi không hợp lệ." }, { status: 400 })
  if (text(body.website, 10)) return NextResponse.json({ ok: true }) // honeypot cho bot

  const auto = body.kind === "audio_error"
  const storyId = positiveInt(body.storyId)
  const episodeId = positiveInt(body.episodeId)
  const message = text(body.message, 1000)
  if (!auto && body.kind === "other" && !message) return NextResponse.json({ error: "Vui lòng mô tả lỗi bạn gặp." }, { status: 400 })

  const visitor = visitorHash(request)
  const now = Date.now()
  prune(now)
  if (auto) {
    const key = `${visitor}:${storyId}:${episodeId}`
    if ((autoHits.get(key) ?? 0) > now - AUTO_WINDOW_MS) return NextResponse.json({ ok: true, recorded: false })
    autoHits.set(key, now)
  } else {
    const hits = (manualHits.get(visitor) ?? []).filter((at) => at > now - MANUAL_WINDOW_MS)
    if (hits.length >= MANUAL_LIMIT) return NextResponse.json({ error: "Bạn đã gửi nhiều báo lỗi, vui lòng thử lại sau ít phút." }, { status: 429 })
    manualHits.set(visitor, [...hits, now])
  }

  const { user } = await getAuthenticatedUser().catch(() => ({ user: null }))
  const { error } = await createServiceDb().from("issue_reports").insert({
    story_id: storyId,
    episode_id: episodeId,
    kind: body.kind,
    message,
    contact: text(body.contact, 200) ?? user?.email ?? null,
    detail: text(body.detail, 500),
    page_url: text(body.pageUrl, 500),
    user_agent: text(request.headers.get("user-agent"), 300),
    visitor_hash: visitor,
    user_id: user?.id ?? null,
    auto,
  })
  if (error) {
    console.warn("issue_reports insert:", error.message)
    return NextResponse.json({ error: "Chưa gửi được báo lỗi, vui lòng thử lại." }, { status: 500 })
  }
  return NextResponse.json({ ok: true, recorded: true })
}
