import { cache } from "react"
import { getEpisodes, supabase, type Episode } from "@/lib/supabase"
import { slugify } from "@/lib/slug"

export interface TrackStory {
  id: number
  slug?: string | null
  title: string
  author: string | null
  genre: string | null
  description: string | null
  audio_url: string | null
  cover_url: string | null
  text_url?: string | null
  episodes: number | null
  duration: string | null
  plays: string | null
  real_views?: number | null
  base_fake_views?: number | null
  status: string | null
}

export type TrackListItem = Pick<TrackStory, "id" | "title" | "genre" | "episodes" | "description" | "cover_url">

const LIST_COLUMNS = "id, title, genre, episodes, description, cover_url"

export function storyPath(story: Pick<TrackStory, "title" | "id">) {
  return slugify(story.title) || String(story.id)
}

export const getStoryList = cache(async (): Promise<TrackListItem[]> => {
  const { data } = await supabase.from("stories").select(LIST_COLUMNS).order("id", { ascending: true })
  return (data ?? []) as TrackListItem[]
})

// Không query cột slug vì production có thể không có cột này.
export const getTrackData = cache(async (paramValue: string) => {
  const allStories = await getStoryList()
  const numericId = Number(paramValue)
  const listed =
    (Number.isInteger(numericId) && numericId > 0 ? allStories.find((item) => item.id === numericId) : undefined) ??
    allStories.find((item) => slugify(item.title) === paramValue)
  if (!listed) return null

  const [{ data: storyData }, { data: episodes }] = await Promise.all([
    supabase.from("stories").select("*").eq("id", listed.id).single(),
    getEpisodes(listed.id),
  ])
  const story = storyData as TrackStory | null
  if (!story) return null
  return { story, episodes: episodes as Episode[], allStories }
})

export function plainDescription(story: Pick<TrackStory, "title" | "author" | "genre" | "description">, maxLength = 160) {
  const base = story.description?.replace(/\s+/g, " ").trim() ||
    `Nghe audio truyện ${story.title}${story.author ? ` của ${story.author}` : ""}${story.genre ? `, thể loại ${story.genre}` : ""} miễn phí trên mê nghe truyện.`
  return base.length > maxLength ? `${base.slice(0, maxLength - 1).trimEnd()}…` : base
}
