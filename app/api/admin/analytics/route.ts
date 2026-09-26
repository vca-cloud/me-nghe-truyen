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

// PostgREST trả tối đa 1000 dòng mỗi lần; đọc theo trang để không bỏ sót log.
async function fetchAllLogs(db: SupabaseClient, from: string | null, to: string | null) {
  const rows: LogRow[] = []
  for (let offset = 0; ; offset += 1000) {
    let query = db.from("listener_logs").select("ip_address, story_id, created_at").order("id").range(offset, offset + 999)
    if (from) query = query.gte("created_at", from)
    if (to) query = query.lt("created_at", to)
    const { data, error } = await query
    if (error) return { rows, error }
    rows.push(...((data || []) as LogRow[]))
    if (!data || data.length < 1000) return { rows, error: null }
  }
}

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
      fetchAllLogs(db, from, to),
      db.from("listener_logs").select("created_at").order("created_at", { ascending: true }).limit(1),
    ])

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
    for (const row of periodLogs.rows) {
      periodListens++
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
    const returningListeners = [...listensPerIp.values()].filter((count) => count > 1).length

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
      affiliateLinks,
      totalClicks,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tải dữ liệu analytics."
    console.error("Analytics API error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
