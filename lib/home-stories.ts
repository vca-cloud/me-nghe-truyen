import { createClient } from "@supabase/supabase-js"
import { formatClockDuration } from "@/lib/duration"
import { slugify } from "@/lib/slug"

export interface HomeStory {
  id: number
  slug: string
  title: string
  author: string
  genre: string
  description: string
  audio_url: string
  cover_url: string | null
  episodes: number
  duration: string
  plays: string
  real_views: number
  base_fake_views: number
  status: string
}

const HOME_COLUMNS = "id, title, author, genre, description, audio_url, cover_url, episodes, duration, plays, real_views, base_fake_views, status"

export async function getHomeStories(): Promise<HomeStory[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) throw new Error("Thiếu cấu hình Supabase server.")

  const db = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data, error } = await db.from("stories").select(HOME_COLUMNS).order("id", { ascending: false })
  if (error) throw error

  return (data || []).map((story) => ({
    id: Number(story.id),
    title: String(story.title || ""),
    author: String(story.author || ""),
    genre: String(story.genre || ""),
    description: String(story.description || ""),
    audio_url: String(story.audio_url || ""),
    cover_url: story.cover_url ? String(story.cover_url) : null,
    episodes: Number(story.episodes || 0),
    duration: formatClockDuration(String(story.duration || "")),
    plays: String(story.plays || "0"),
    real_views: Number(story.real_views ?? 0),
    base_fake_views: Number(story.base_fake_views ?? story.plays ?? 0),
    status: String(story.status || "Đang cập nhật"),
    slug: slugify(String(story.title || "")) || String(story.id),
  }))
}
