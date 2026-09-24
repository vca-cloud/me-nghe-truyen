import { OG_SIZE, renderOgCard } from "@/lib/og-card"
import { getTrackData } from "@/lib/track-data"

export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Ảnh xem trước truyện audio trên mê nghe truyện"
export const revalidate = 3600

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getTrackData(decodeURIComponent(slug))
  if (!data) return renderOgCard({ title: "Nghe truyện audio miễn phí" })
  const { story, episodes } = data
  const parts = [story.author, story.genre?.split(",")[0]?.trim(), `${episodes.length || story.episodes || 1} tập`].filter(Boolean)
  return renderOgCard({ title: story.title, subtitle: parts.join(" • "), coverUrl: story.cover_url })
}
