"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type KeyboardEvent } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Play } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { getCategoryOptions, type CategoryOption } from "@/lib/category-options"
import { formatClockDuration } from "@/lib/duration"
import { slugify } from "@/lib/slug"
import { totalViewsFor } from "@/lib/story-views"

function viewsFor(story: Story) {
  return totalViewsFor(story)
}

function storyActiveListeners(activeListenersMap: Map<number, number>, storyId: number) {
  return activeListenersMap.get(storyId) ?? 5
}

interface Story {
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
  real_views?: number | null
  base_fake_views?: number | null
  status: string
}

function genresFor(value: string | null | undefined) {
  return value?.split(",").map((genre) => genre.trim()).filter(Boolean) || ["Khác"]
}

const homeDescriptionClass = "text-muted-foreground dark:text-[#2D74A8]"
const homeGenreClass = "text-muted-foreground dark:text-[#2D74A8] dark:border-[#2D74A8]"
const homeMetricClass = "text-muted-foreground dark:text-[#2D74A8]"

export default function Page() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [activeListenersMap, setActiveListenersMap] = useState<Map<number, number>>(new Map())
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [submittedSearch, setSubmittedSearch] = useState("")
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["Tất cả"])
  const [genreExpanded, setGenreExpanded] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const pageSize = 6

  useEffect(() => {
    const stored = localStorage.getItem("activeListenersMap")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setActiveListenersMap(new Map(Object.entries(parsed).map(([k, v]) => [Number(k), Number(v)])))
      } catch {}
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveListenersMap((current) => {
        const next = new Map(current)
        for (const [storyId, value] of next) {
          const direction = Math.random() < 0.5 ? -1 : 1
          const newValue = Math.max(5, Math.min(85, value + direction * 5))
          next.set(storyId, newValue)
        }
        const obj = Object.fromEntries(next)
        localStorage.setItem("activeListenersMap", JSON.stringify(obj))
        return next
      })
    }, 10 * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    async function fetchStories() {
      try {
        const response = await fetch("/api/home-stories", { cache: "no-store" })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload?.error || "Không tải được dữ liệu")
        const normalizedStories = ((payload.stories || []) as Array<Record<string, unknown>>)
          .map((story) => ({
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
          .sort((a, b) => {
            const totalA = a.real_views + a.base_fake_views
            const totalB = b.real_views + b.base_fake_views
            return totalB - totalA
          })
        setStories(normalizedStories)
        setActiveListenersMap((current) => {
          const next = new Map<number, number>()
          normalizedStories.forEach((story) => next.set(story.id, current.get(story.id) ?? Math.floor(Math.random() * 81) + 5))
          localStorage.setItem("activeListenersMap", JSON.stringify(Object.fromEntries(next)))
          return next
        })
      } catch (error: unknown) {
        toast.error(`Lỗi: ${error instanceof Error ? error.message : "Không tải được dữ liệu."}`)
      } finally { setLoading(false) }
    }
    const reload = () => { void fetchStories() }
    reload()
    void getCategoryOptions().then(setCategoryOptions)
    window.addEventListener("focus", reload)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") reload()
    })
    return () => window.removeEventListener("focus", reload)
  }, [])

  const filteredStories = useMemo(() => stories.filter((story) => {
    const query = (submittedSearch || searchTerm).trim().toLowerCase()
    const haystack = [story.title, story.author, story.genre, story.description].join(" ").toLowerCase()
    const matchesSearch = !query || haystack.includes(query)
    const matchesGenre = selectedGenres.includes("Tất cả") || selectedGenres.some((genre) => genresFor(story.genre).includes(genre))
    return matchesSearch && matchesGenre
  }), [stories, searchTerm, submittedSearch, selectedGenres])
  const suggestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return []
    return stories.filter((story) => [story.title, story.author, story.genre, story.description].join(" ").toLowerCase().includes(query)).slice(0, 8)
  }, [stories, searchTerm])
  const totalPages = Math.max(1, Math.ceil(filteredStories.length / pageSize))
  const pageStories = filteredStories.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => setCurrentPage(1), [submittedSearch, selectedGenres])

  const handleSearchInput = (value: string) => {
    setSearchTerm(value)
    setShowSuggestions(true)
    if (!value.trim()) {
      setSubmittedSearch("")
      setShowSuggestions(false)
    }
  }
  const submitSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setSubmittedSearch(searchTerm.trim())
      setShowSuggestions(false)
    }
  }
  const chooseSuggestion = (story: Story) => {
    setSearchTerm(story.title)
    setSubmittedSearch(story.title)
    setShowSuggestions(false)
  }
  const toggleGenre = (genre: string) => {
    if (genre === "Tất cả") return setSelectedGenres(["Tất cả"])
    setSelectedGenres((current) => {
      const next = current.includes(genre) ? current.filter((item) => item !== genre && item !== "Tất cả") : [...current.filter((item) => item !== "Tất cả"), genre]
      return next.length ? next : ["Tất cả"]
    })
  }
  const storyUrl = (story: Story) => `/track/${story.slug || story.id}`
  const genreBadges = (genre: string | null | undefined) => <div className="flex flex-wrap gap-1">{genresFor(genre).map((item) => <Badge key={item} variant="outline" className={`text-xs ${homeGenreClass}`}>{item}</Badge>)}</div>
  const visibleCategories = useMemo(() => {
    const fromStories = [...new Set(stories.flatMap((story) => genresFor(story.genre)))]
    const fromAdmin = categoryOptions.filter((category) => category.visible).map((category) => category.name)
    const names = [...new Set([...fromAdmin, ...fromStories])].filter(Boolean)
    return names.map((name, index) => ({ id: name || index, name, visible: true }))
  }, [categoryOptions, stories])

  return <div className="min-h-screen bg-background">
    <Header
      value={searchTerm}
      onChange={handleSearchInput}
      onKeyDown={submitSearch}
      suggestions={showSuggestions ? suggestions : []}
      onSuggestion={chooseSuggestion}
    />
    <main className="w-full min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mb-8"><h1 className="text-3xl font-bold tracking-tight">Danh sách audio <Badge className="ml-2 border-transparent bg-[#EE4D2D] text-[14px] font-bold text-white hover:bg-[#EE4D2D]">{loading ? "Đang tải..." : `${filteredStories.length} truyện`}</Badge></h1></div>
      <div className="mb-10 flex flex-wrap items-start gap-3">
        <span className="pt-2 text-sm font-medium">Thể loại:</span>
        <div className="flex flex-wrap gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm">
            <input type="checkbox" checked={selectedGenres.includes("Tất cả")} onChange={() => toggleGenre("Tất cả")} />
            Tất cả
          </label>
          {(genreExpanded ? visibleCategories : visibleCategories.slice(0, 5)).map((category) => (
            <label key={category.id} className="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm">
              <input type="checkbox" checked={selectedGenres.includes(category.name)} onChange={() => toggleGenre(category.name)} />
              {category.name}
            </label>
          ))}
        </div>
        {visibleCategories.length > 5 && (
          <Button type="button" variant="outline" size="sm" onClick={() => setGenreExpanded((expanded) => !expanded)}>
            {genreExpanded ? "Thu gọn" : "Xem thêm"}
          </Button>
        )}
      </div>
      <section className="mb-12"><h2 className="mb-6 text-2xl font-semibold">Được nghe nhiều</h2><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{loading ? <p>Đang tải truyện...</p> : filteredStories.slice(0, 4).map((story, index) => <Link key={story.id} href={storyUrl(story)} className="block rounded-xl border bg-card p-5 shadow-sm hover:border-primary"><div className="flex flex-col gap-3"><div className="flex items-center gap-3"><span className="text-6xl font-bold text-[#EE4D2D]">{index + 1}</span><span className="flex h-10 w-10 items-center justify-center rounded border"><Play className="h-5 w-5" /></span>{genreBadges(story.genre)}</div><h3 className="text-[22px] font-bold">{story.title}</h3><p className={`line-clamp-2 text-justify ${homeDescriptionClass}`}>{story.description}</p><div className={`grid grid-cols-3 gap-3 text-sm ${homeMetricClass}`}><div><div>Lượt nghe</div><div className="mt-1 text-[14px] font-bold">{viewsFor(story).toLocaleString()}</div></div><div><div>Đang nghe</div><div className="mt-1 flex items-center gap-1 font-bold text-green-600"><span className="h-2 w-2 animate-pulse rounded-full bg-[#EE4D2D]" /><span className="text-[14px] font-bold text-[#EE4D2D]">{storyActiveListeners(activeListenersMap, story.id)}</span></div></div><div><div>Thời lượng</div><div className="mt-1 text-[14px] font-bold">{story.duration}</div></div></div></div></Link>)}</div></section>
      <div id="audio-list" className="space-y-2">{pageStories.map((story) => <Link key={story.id} href={storyUrl(story)} className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border"><Play className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold">{story.title}</h3>{genreBadges(story.genre)}</div><p className={`line-clamp-2 text-sm ${homeDescriptionClass}`}>{story.description || "Chưa có mô tả cho truyện này."}</p><div className={`mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-[14px] sm:grid-cols-4 ${homeMetricClass}`}><div><div>Mê nghe truyện</div><div className="mt-1 font-bold">{story.episodes || 0} tập</div></div><div><div>Lượt nghe</div><div className="mt-1 font-bold">{viewsFor(story).toLocaleString()}</div></div><div><div>Đang nghe</div><div className="mt-1 flex items-center gap-1 font-bold text-[#EE4D2D]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#EE4D2D]" />{storyActiveListeners(activeListenersMap, story.id)}</div></div><div><div>Thời lượng</div><div className="mt-1 font-bold">{story.duration}</div></div></div></div><span className="shrink-0 text-[14px] font-bold text-muted-foreground">{story.duration}</span></Link>)}</div>
      <div className="mt-12 flex justify-center gap-3"><Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Trước</Button><span className="flex items-center">{currentPage} / {totalPages}</span><Button variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>Sau</Button></div>
    </main>
    <Footer />
  </div>
}
