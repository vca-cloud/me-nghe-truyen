import { totalViewsFor } from "@/lib/story-views"

export const FEATURED_SLOTS = 4

type Rankable = { id: number; featured_rank?: number | null; real_views?: unknown; base_fake_views?: unknown }

// Top 4 trang chủ: truyện admin ghim đứng đúng vị trí 1–4; ô trống lấy truyện nhiều lượt nghe nhất chưa được ghim.
export function pickTopStories<T extends Rankable>(stories: T[]): T[] {
  const slots: (T | null)[] = Array(FEATURED_SLOTS).fill(null)
  for (const story of stories) {
    const rank = Number(story.featured_rank)
    if (Number.isInteger(rank) && rank >= 1 && rank <= FEATURED_SLOTS && !slots[rank - 1]) slots[rank - 1] = story
  }
  const pinned = new Set(slots.filter(Boolean).map((story) => story!.id))
  const byViews = stories.filter((story) => !pinned.has(story.id)).sort((a, b) => totalViewsFor(b) - totalViewsFor(a))
  return slots.map((story) => story ?? byViews.shift() ?? null).filter((story): story is T => story !== null)
}
