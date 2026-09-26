import { NextResponse } from "next/server"
import { hasAdminSession } from "@/lib/admin-auth"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { fakeViewsFor, realViewsFor } from "@/lib/story-views"

export const dynamic = "force-dynamic"

type Row = Record<string, unknown>
type Story = {
  id: number
  title: string
  genre: string | null
  description: string | null
  status: string | null
  realViews: number
  fakeViews: number
}

const toNumber = (value: unknown) => {
  const result = Number(value)
  return Number.isFinite(result) ? result : 0
}

const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const genresOf = (value: unknown) => {
  const genres = String(value || "Khác").split(",").map((item) => item.trim()).filter(Boolean)
  return genres.length ? genres : ["Khác"]
}

type LogRow = { ip_address: string | null; story_id: number | null; created_at: string }
type AffiliateEventRow = { event: "impression" | "click"; link_id: number | null; story_id: number | null; visitor_hash: string; created_at: string }

// PostgREST trả tối đa 1000 dòng mỗi lần; đọc theo trang để không bỏ sót dữ liệu.
async function fetchAllRows<T>(db: SupabaseClient, table: string, columns: string, from: string | null, to: string | null) {
  const rows: T[] = []
  for (let offset = 0; ; offset += 1000) {
    let query = db.from(table).select(columns).order("id").range(offset, offset + 999)
    if (from) query = query.gte("created_at", from)
    if (to) query = query.lt("created_at", to)
    const { data, error } = await query
    if (error) return { rows, error }
    rows.push(...((data || []) as T[]))
    if (!data || data.length < 1000) return { rows, error: null }
  }
}

// Ngày theo giờ Việt Nam (UTC+7) để gom biểu đồ theo ngày.
const vnDay = (iso: string) => new Date(Date.parse(iso) + 7 * 3600 * 1000).toISOString().slice(0, 10)

export async function GET(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: "Thiếu cấu hình Supabase server." }, { status: 500 })

  const params = new URL(request.url).searchParams
  const from = params.get("from")
  const to = params.get("to")

  try {
    const db = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
    // Danh mục (truyện, tập, thành viên, affiliate) luôn là toàn bộ; bộ lọc ngày chỉ áp dụng cho log lượt nghe.
    const [storiesResult, episodesResult, membersResult, linksResult, periodLogs, firstLogResult] = await Promise.all([
      db.from("stories").select("*").order("id", { ascending: true }),
      db.from("episodes").select("id", { count: "exact", head: true }),
      db.from("admin_users").select("auth_id", { count: "exact", head: true }),
      db.from("affiliate_links").select("*").order("clicks", { ascending: false }),
      fetchAllRows<LogRow>(db, "listener_logs", "ip_address, story_id, created_at", from, to),
      db.from("listener_logs").select("created_at").order("created_at", { ascending: true }).limit(1),
    ])
    const [affiliateEvents, firstEventResult] = await Promise.all([
      fetchAllRows<AffiliateEventRow>(db, "affiliate_events", "event, link_id, story_id, visitor_hash, created_at", from, to),
      db.from("affiliate_events").select("created_at").order("created_at", { ascending: true }).limit(1),
    ])
    if (affiliateEvents.error) console.warn("affiliate_events unavailable:", affiliateEvents.error.message)

    if (storiesResult.error) throw new Error(`stories: ${storiesResult.error.message}`)
    if (episodesResult.error) throw new Error(`episodes: ${episodesResult.error.message}`)
    if (membersResult.error) throw new Error(`admin_users: ${membersResult.error.message}`)
    if (linksResult.error) throw new Error(`affiliate_links: ${linksResult.error.message}`)
    if (periodLogs.error) console.warn("listener_logs unavailable:", periodLogs.error.message)

    const stories: Story[] = (storiesResult.data || []).map((story: Row) => ({
      id: toNumber(story.id),
      title: String(story.title || ""),
      genre: story.genre == null ? null : String(story.genre),
      description: story.description == null ? null : String(story.description),
      status: story.status == null ? null : String(story.status),
      realViews: realViewsFor(story),
      fakeViews: fakeViewsFor(story),
    }))

    const affiliateLinks = (linksResult.data || []).map((link: Row) => ({
      id: toNumber(link.id),
      title: String(link.title || ""),
      url: String(link.shoppe_url || link.shopee_url || link.url || ""),
      image_url: link.image_url == null ? null : String(link.image_url),
      clicks: toNumber(link.clicks),
      is_active: Boolean(link.is_active),
    }))
    const totalClicks = affiliateLinks.reduce((sum, link) => sum + link.clicks, 0)

    const listensPerIp = new Map<string, number>()
    const activeIps = new Set<string>()
    const activeRealByStory = new Map<number, number>()
    const activeSince = Date.now() - 15 * 60 * 1000
    let periodListens = 0
    const listensByDayMap = new Map<string, number>()
    for (const row of periodLogs.rows) {
      periodListens++
      const day = vnDay(row.created_at)
      listensByDayMap.set(day, (listensByDayMap.get(day) || 0) + 1)
      const ip = String(row.ip_address || "").trim()
      if (!ip || ip === "unknown") continue
      listensPerIp.set(ip, (listensPerIp.get(ip) || 0) + 1)
      if (Date.parse(row.created_at) >= activeSince) {
        activeIps.add(ip)
        const storyId = toNumber(row.story_id)
        if (storyId) activeRealByStory.set(storyId, (activeRealByStory.get(storyId) || 0) + 1)
      }
    }
    const periodListeners = listensPerIp.size
    // Điền đủ các ngày không có lượt nghe để trục thời gian liên tục.
    const listensByDay: { date: string; listens: number }[] = []
    const days = [...listensByDayMap.keys()].sort()
    if (days.length) {
      const startDay = from ? vnDay(from) : days[0]
      const lastDataOrToday = to ? vnDay(new Date(Date.parse(to) - 1).toISOString()) : vnDay(new Date().toISOString())
      const cursor = new Date(`${startDay < days[0] ? startDay : days[0]}T00:00:00Z`)
      const end = new Date(`${lastDataOrToday}T00:00:00Z`)
      for (let i = 0; cursor <= end && i < 400; i++) {
        const date = cursor.toISOString().slice(0, 10)
        listensByDay.push({ date, listens: listensByDayMap.get(date) || 0 })
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      }
    }
    const returningListeners = [...listensPerIp.values()].filter((count) => count > 1).length

    const storyTitle = new Map(stories.map((story) => [story.id, story.title]))
    const linkTitle = new Map(affiliateLinks.map((link) => [link.id, link.title]))
    const byDay = new Map<string, { impressions: number; clicks: number }>()
    const byStory = new Map<number, { impressions: number; clicks: number }>()
    const byLink = new Map<number, { impressions: number; clicks: number }>()
    const viewers = new Set<string>()
    const clickers = new Set<string>()
    let impressions = 0
    let clicks = 0
    const bump = <K,>(map: Map<K, { impressions: number; clicks: number }>, key: K, event: AffiliateEventRow["event"]) => {
      const entry = map.get(key) || { impressions: 0, clicks: 0 }
      if (event === "click") entry.clicks++
      else entry.impressions++
      map.set(key, entry)
    }
    for (const row of affiliateEvents.rows) {
      if (row.event === "click") { clicks++; clickers.add(row.visitor_hash) } else { impressions++; viewers.add(row.visitor_hash) }
      bump(byDay, vnDay(row.created_at), row.event)
      if (row.story_id) bump(byStory, row.story_id, row.event)
      if (row.link_id) bump(byLink, row.link_id, row.event)
    }
    const withRate = (value: { impressions: number; clicks: number }) => ({ ...value, rate: value.impressions ? value.clicks / value.impressions * 100 : null })
    const affiliate = {
      since: firstEventResult.data?.[0]?.created_at ?? null,
      impressions,
      clicks,
      uniqueViewers: viewers.size,
      uniqueClickers: clickers.size,
      conversionRate: impressions ? clicks / impressions * 100 : null,
      byDay: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, ...value })),
      byStory: [...byStory.entries()].map(([id, value]) => ({ id, title: storyTitle.get(id) || `#${id}`, ...withRate(value) })).sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 10),
      byLink: [...byLink.entries()].map(([id, value]) => ({ id, title: linkTitle.get(id) || `#${id}`, ...withRate(value) })).sort((a, b) => b.clicks - a.clicks),
    }

    const realViews = stories.reduce((sum, story) => sum + story.realViews, 0)
    const fakeViews = stories.reduce((sum, story) => sum + story.fakeViews, 0)
    const activeFakeListeners = randomBetween(15, 85)
    const genreMap = new Map<string, { realViews: number; fakeViews: number; stories: number; activeReal: number }>()

    for (const story of stories) {
      for (const genre of genresOf(story.genre)) {
        const current = genreMap.get(genre) || { realViews: 0, fakeViews: 0, stories: 0, activeReal: 0 }
        current.realViews += story.realViews
        current.fakeViews += story.fakeViews
        current.stories += 1
        current.activeReal += activeRealByStory.get(story.id) || 0
        genreMap.set(genre, current)
      }
    }

    const genreStats = [...genreMap.entries()].map(([genre, value]) => ({
      genre,
      stories: value.stories,
      realViews: value.realViews,
      fakeViews: value.fakeViews,
      activeReal: value.activeReal,
      activeFake: Math.max(0, Math.round(activeFakeListeners * value.stories / Math.max(1, stories.length))),
    })).sort((a, b) => b.realViews + b.fakeViews - a.realViews - a.fakeViews)

    return NextResponse.json({
      metrics: {
        totalStories: stories.length,
        totalEpisodes: episodesResult.count || 0,
        totalMembers: membersResult.count || 0,
        realViews,
        fakeViews,
        periodListens,
        periodListeners,
        activeRealListeners: activeIps.size,
        activeFakeListeners,
        totalClicks,
        clicksPerRealView: realViews ? totalClicks / realViews : 0,
        retentionRate: periodListeners ? returningListeners / periodListeners * 100 : 0,
        logsSince: firstLogResult.data?.[0]?.created_at ?? null,
      },
      stories,
      genreStats,
      listensByDay,
      affiliateLinks,
      totalClicks,
      affiliate,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tải dữ liệu analytics."
    console.error("Analytics API error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
