import Link from "next/link"
import { notFound } from "next/navigation"
import { Bookmark, Headphones, ListPlus } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TrackExperience } from "@/components/track/track-experience"
import { ImageWithFallback } from "@/components/image-with-fallback"
import { getEpisodes, supabase } from "@/lib/supabase"
import { slugify } from "@/lib/slug"

interface Story {
  id: number
  slug?: string | null
  title: string
  author: string | null
  genre: string | null
  description: string | null
  audio_url: string | null
  cover_url: string | null
  episodes: number | null
  duration: string | null
  plays: string | null
  status: string | null
}

function storyPath(story: Pick<Story, "title">) {
  return slugify(story.title)
}

export default async function TrackPage({ params }: { params: Promise<{ slug?: string; id?: string }> }) {
  const routeParams = await params
  const paramValue = decodeURIComponent(routeParams.slug || routeParams.id || "")

  let story: Story | null = null

  // Nếu paramValue là số, tìm theo ID
  const numericId = Number(paramValue)
  if (Number.isInteger(numericId) && numericId > 0) {
    const { data } = await supabase
      .from("stories")
      .select("*")
      .eq("id", numericId)
      .single()
    story = data
  }

  // Nếu chưa tìm thấy, tìm theo slug/title (không query cột slug)
  if (!story) {
    const { data: allStories } = await supabase.from("stories").select("*")
    story = allStories?.find((item) => {
      const generatedSlug = slugify(item.title)
      return generatedSlug === paramValue
    }) as Story | undefined || null
  }

  if (!story) notFound()

  const { data: allStories } = await supabase
    .from("stories")
    .select("*")
    .order("id", { ascending: true })

  const storySlugs = allStories?.map((item) => storyPath(item as Story)).filter(Boolean) ?? []
  const currentIndex = storySlugs.indexOf(paramValue)
  const previousTrackSlug = currentIndex > 0 ? storySlugs[currentIndex - 1] : undefined
  const nextTrackSlug = currentIndex >= 0 && currentIndex < storySlugs.length - 1 ? storySlugs[currentIndex + 1] : undefined
  const relatedStories = allStories
    ?.filter((item) => item.id !== story.id)
    .slice(-6)
    .reverse() as Story[] | undefined
  const { data: episodes } = await getEpisodes(story.id)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="w-full px-4 py-8 md:px-8 lg:px-12">
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/">Danh sách audio</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{story.title}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:gap-10">
          <aside className="flex min-h-0 flex-col gap-8">
            <section className="flex flex-col gap-4">
              <Badge className="w-fit">{story.plays || "0"} lượt nghe</Badge>
              <div className="aspect-square w-full overflow-hidden rounded-xl border">
                {story.cover_url ? (
                  <ImageWithFallback src={story.cover_url} alt={story.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground" role="img" aria-label={story.title}>
                    <Headphones className="h-1/3 w-1/3" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{story.title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {story.author || "Chưa rõ tác giả"} • {story.episodes || 1} tập
                </p>
                {story.genre && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {story.genre.split(",").map((genre: string) => genre.trim()).filter(Boolean).map((genre: string) => (
                      <Badge key={genre} variant="outline">{genre}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-justify text-sm leading-6 text-muted-foreground">{story.description || "Chưa có mô tả."}</p>
              <div className="flex flex-wrap gap-2">
                <Button className="flex-1" nativeButton={false} render={<a href="#audio-player" />}>Nghe tiếp</Button>
                <Button variant="outline" size="icon" aria-label="Yêu thích"><Bookmark className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" aria-label="Thêm vào danh sách"><ListPlus className="h-4 w-4" /></Button>
              </div>
            </section>
            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
              {episodes.length || story.episodes || 1} tập {story.status ? `- ${story.status.toLowerCase()}` : ""}
            </div>
          </aside>

          <section className="flex flex-col gap-12">
            <Card id="audio-player" className="w-full"><CardContent className="p-4 sm:p-6 md:p-10">
              <TrackExperience
                storyId={story.id}
                title={story.title}
                audioUrl={story.audio_url}
                coverUrl={story.cover_url}
                episodeCount={story.episodes || 1}
                status={story.status}
                episodes={episodes}
                previousTrackId={previousTrackSlug}
                nextTrackId={nextTrackSlug}
              />
            </CardContent></Card>

            {relatedStories && relatedStories.length > 0 && <section className="flex flex-col gap-5">
              <h2 className="text-2xl font-bold">Truyện liên quan</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {relatedStories.map((related) => (
                  <Link key={related.id} href={`/track/${storyPath(related)}`}>
                    <Card className="h-full overflow-hidden transition-colors hover:bg-accent">
                      <div className="aspect-video border-b">
                        {related.cover_url ? (
                          <ImageWithFallback src={related.cover_url} alt={related.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground" role="img" aria-label={related.title}>
                            <Headphones className="h-1/3 w-1/3" strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                      <CardContent className="flex flex-col gap-2 p-4">
                        <h3 className="font-semibold text-foreground" style={{ color: '#154B95' }}>{related.title}</h3>
                        <p className="text-xs" style={{ color: '#154B95' }}>{related.genre || "Khác"} • {related.episodes || 1} tập</p>
                        <p className="line-clamp-2 text-justify text-sm" style={{ color: '#154B95' }}>{related.description || "Chưa có mô tả."}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
