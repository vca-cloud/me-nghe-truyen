"use client"

import Link from "next/link"
import { ContinueListening } from "@/components/continue-listening"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Play } from "lucide-react"
import { toast } from "sonner"
import { getCategoryOptions, type CategoryOption } from "@/lib/category-options"
import type { HomeStory } from "@/lib/home-stories"
import { totalViewsFor } from "@/lib/story-views"

function viewsFor(story: Story) {
  return totalViewsFor(story)
}

function storyActiveListeners(activeListenersMap: Map<number, number>, storyId: number) {
  return activeListenersMap.get(storyId) ?? 5
}

type Story = HomeStory

function genresFor(value: string | null | undefined) {
  return value?.split(",").map((genre) => genre.trim()).filter(Boolean) || ["Khác"]
}

const homeDescriptionClass = "text-muted-foreground dark:text-[#2D74A8]"
const homeGenreClass = "text-muted-foreground dark:text-[#2D74A8] dark:border-[#2D74A8]"
const homeMetricClass = "text-muted-foreground dark:text-[#2D74A8]"

export function HomePage({ initialStories }: { initialStories: Story[] | null }) {
  const [stories, setStories] = useState<Story[]>(initialStories ?? [])
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
    function applyStories(nextStories: Story[]) {
      setStories(nextStories)
      setActiveListenersMap((current) => {
        let stored: Record<string, number> = {}
        try { stored = JSON.parse(localStorage.getItem("activeListenersMap") || "{}") } catch {}
        const next = new Map<number, number>()
        nextStories.forEach((story) => next.set(story.id, current.get(story.id) ?? (Number(stored[story.id]) || Math.floor(Math.random() * 81) + 5)))
        localStorage.setItem("activeListenersMap", JSON.stringify(Object.fromEntries(next)))
        return next
      })
    }
    async function fetchStories() {
      try {
        const response = await fetch("/api/home-stories")
        const payload = await response.json()
        if (!response.ok) throw new Error(payload?.error || "Không tải được dữ liệu")
        applyStories((payload.stories || []) as Story[])
      } catch (error: unknown) {
        toast.error(`Lỗi: ${error instanceof Error ? error.message : "Không tải được dữ liệu."}`)
      }
    }
    if (initialStories) applyStories(initialStories)
    else void fetchStories()
    void getCategoryOptions().then(setCategoryOptions)
    const reload = () => { void fetchStories() }
    const onVisible = () => { if (document.visibilityState === "visible") reload() }
    window.addEventListener("focus", reload)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.removeEventListener("focus", reload)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [initialStories])

  const popularStories = useMemo(() => [...stories].sort((a, b) => {
    const totalA = Number(a.real_views || 0) + Number(a.base_fake_views || 0)
    const totalB = Number(b.real_views || 0) + Number(b.base_fake_views || 0)
    return totalB - totalA
  }), [stories])

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


  const handleSearchInput = (value: string) => {
    setSearchTerm(value)
    setShowSuggestions(true)
    if (!value.trim()) {
      setSubmittedSearch("")
      setCurrentPage(1)
      setShowSuggestions(false)
    }
  }
  const submitSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setSubmittedSearch(searchTerm.trim())
      setCurrentPage(1)
      setShowSuggestions(false)
    }
  }
  const chooseSuggestion = (story: Story) => {
    setSearchTerm(story.title)
    setSubmittedSearch(story.title)
    setCurrentPage(1)
    setShowSuggestions(false)
  }
  const toggleGenre = (genre: string) => {
    setCurrentPage(1)
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
      <ContinueListening />
      <section className="mb-12"><h1 className="mb-6 text-3xl font-bold">Được nghe nhiều</h1><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{popularStories.slice(0, 4).map((story, index) => <Link key={story.id} href={storyUrl(story)} className="block rounded-xl border bg-card p-5 shadow-sm hover:border-primary"><div className="flex flex-col gap-3"><div className="flex items-center gap-3"><span className="text-6xl font-bold text-[#EE4D2D]">{index + 1}</span><span className="flex h-10 w-10 items-center justify-center rounded border"><Play className="h-5 w-5" /></span>{genreBadges(story.genre)}</div><h3 className="text-[22px] font-bold">{story.title}</h3><p className={`line-clamp-2 text-justify ${homeDescriptionClass}`}>{story.description}</p><div className={`grid grid-cols-3 gap-3 text-sm ${homeMetricClass}`}><div><div>Lượt nghe</div><div className="mt-1 text-[14px] font-bold">{viewsFor(story).toLocaleString()}</div></div><div><div>Đang nghe</div><div className="mt-1 flex items-center gap-1 font-bold text-green-600"><span className="h-2 w-2 animate-pulse rounded-full bg-[#EE4D2D]" /><span className="text-[14px] font-bold text-[#EE4D2D]">{storyActiveListeners(activeListenersMap, story.id)}</span></div></div><div><div>Thời lượng</div><div className="mt-1 text-[14px] font-bold">{story.duration}</div></div></div></div></Link>)}</div></section>
      <div className="mb-8"><h2 className="text-3xl font-bold tracking-tight">Danh sách audio <Badge className="ml-2 border-transparent bg-[#EE4D2D] text-[14px] font-bold text-white hover:bg-[#EE4D2D]">{`${filteredStories.length} truyện`}</Badge></h2></div>
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
      <div id="audio-list" className="space-y-2">{pageStories.map((story) => <Link key={story.id} href={storyUrl(story)} className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border"><Play className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold">{story.title}</h3>{genreBadges(story.genre)}</div><p className={`line-clamp-2 text-sm ${homeDescriptionClass}`}>{story.description || "Chưa có mô tả cho truyện này."}</p><div className={`mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-[14px] sm:grid-cols-4 ${homeMetricClass}`}><div><div>Mê nghe truyện</div><div className="mt-1 font-bold">{story.episodes || 0} tập</div></div><div><div>Lượt nghe</div><div className="mt-1 font-bold">{viewsFor(story).toLocaleString()}</div></div><div><div>Đang nghe</div><div className="mt-1 flex items-center gap-1 font-bold text-[#EE4D2D]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#EE4D2D]" />{storyActiveListeners(activeListenersMap, story.id)}</div></div><div><div>Thời lượng</div><div className="mt-1 font-bold">{story.duration}</div></div></div></div><span className="shrink-0 text-[14px] font-bold text-muted-foreground">{story.duration}</span></Link>)}</div>
      <div className="mt-12 flex justify-center gap-3"><Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Trước</Button><span className="flex items-center">{currentPage} / {totalPages}</span><Button variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>Sau</Button></div>
    </main>
    <Footer />
  </div>
}
