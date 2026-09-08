import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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
const legacyFakeViews = (storyId: number) => storyId === 1 ? 10312 : storyId === 2 ? 5960 : randomBetween(1500, 15000)
const genresOf = (value: unknown) => {
  const genres = String(value || "Khác").split(",").map((item) => item.trim()).filter(Boolean)
  return genres.length ? genres : ["Khác"]
}

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: "Thiếu cấu hình Supabase server." }, { status: 500 })

  const params = new URL(request.url).searchParams
  const from = params.get("from")
  const to = params.get("to")

  try {
    const db = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
    let storiesQuery = db.from("stories").select("*").order("id", { ascending: true })
    let episodesQuery = db.from("episodes").select("id", { count: "exact", head: true })
    let membersQuery = db.from("admin_users").select("id", { count: "exact", head: true })
    let linksQuery = db.from("affiliate_links").select("*").order("clicks", { ascending: false })

    if (from) {
      storiesQuery = storiesQuery.gte("created_at", from)
      episodesQuery = episodesQuery.gte("created_at", from)
      membersQuery = membersQuery.gte("created_at", from)
      linksQuery = linksQuery.gte("created_at", from)
    }
    if (to) {
      storiesQuery = storiesQuery.lt("created_at", to)
      episodesQuery = episodesQuery.lt("created_at", to)
      membersQuery = membersQuery.lt("created_at", to)
      linksQuery = linksQuery.lt("created_at", to)
    }

    const [storiesResult, episodesResult, membersResult, linksResult] = await Promise.all([
      storiesQuery,
      episodesQuery,
      membersQuery,
      linksQuery,
    ])

    if (storiesResult.error) throw new Error(`stories: ${storiesResult.error.message}`)
    if (episodesResult.error) throw new Error(`episodes: ${episodesResult.error.message}`)
    if (membersResult.error) throw new Error(`admin_users: ${membersResult.error.message}`)
    if (linksResult.error) throw new Error(`affiliate_links: ${linksResult.error.message}`)

    // Do not mutate the database here. Analytics must reflect the stored values.
    const stories: Story[] = (storiesResult.data || []).map((story: Row) => ({
      id: toNumber(story.id),
      title: String(story.title || ""),
      genre: story.genre == null ? null : String(story.genre),
      description: story.description == null ? null : String(story.description),
      status: story.status == null ? null : String(story.status),
      realViews: toNumber(story.real_views || story.plays || 0),
      fakeViews: toNumber(story.base_fake_views) || legacyFakeViews(toNumber(story.id)),
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

    let uniqueIps = new Set<string>()
    let returningIps = 0
    let activeRealListeners = 0
    const activeRealByStory = new Map<number, number>()
    let logsQuery = db.from("listener_logs").select("ip_address, story_id, created_at")
    if (from) logsQuery = logsQuery.gte("created_at", from)
    if (to) logsQuery = logsQuery.lt("created_at", to)
    const logsResult = await logsQuery

    if (!logsResult.error) {
      const counts = new Map<string, number>()
      const activeIps = new Set<string>()
      const activeSince = Date.now() - 15 * 60 * 1000
      for (const row of (logsResult.data || []) as Array<{ ip_address?: string | null; story_id?: number | null; created_at?: string | null }>) {
        const ip = String(row.ip_address || "").trim()
        if (!ip || ip === "unknown") continue
        uniqueIps.add(ip)
        counts.set(ip, (counts.get(ip) || 0) + 1)
        if (row.created_at && Date.parse(row.created_at) >= activeSince) {
          activeIps.add(ip)
          const storyId = toNumber(row.story_id)
          if (storyId) activeRealByStory.set(storyId, (activeRealByStory.get(storyId) || 0) + 1)
        }
      }
      returningIps = [...counts.values()].filter((count) => count > 1).length
      activeRealListeners = Math.min(5, activeIps.size)
    } else {
      console.warn("listener_logs unavailable; IP metrics default to zero:", logsResult.error.message)
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
        totalVisits: uniqueIps.size,
        realViews,
        fakeViews,
        activeRealListeners,
        activeFakeListeners,
        affiliateRate: realViews ? totalClicks / realViews * 100 : 0,
        retentionRate: uniqueIps.size ? returningIps / uniqueIps.size * 100 : 0,
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
