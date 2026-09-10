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
import { slugify } from "@/lib/slug"
import { randomActiveListeners, updateActiveListeners, randomSocialProofDelay } from "@/lib/social-proof"

function viewsFor(story: Story) {
  const real = Number(story.real_views || 0)
  const fake = Number(story.base_fake_views || story.plays || 0)
  return real + fake
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
        const { data, error } = await supabase
          .from("stories")
          .select("id, title, author, genre, description, audio_url, cover_url, episodes, duration, plays, real_views, base_fake_views, status")
          .order("id", { ascending: false })
        if (error) throw error
        const normalizedStories = ((data || []) as Array<Record<string, unknown>>).map((story) => ({
          id: Number(story.id),
          slug: slugify(String(story.title || "")) || String(story.id),
          title: String(story.title || ""),
          author: String(story.author || ""),
          genre: String(story.genre || ""),
          description: String(story.description || ""),
          audio_url: String(story.audio_url || ""),
          cover_url: story.cover_url ? String(story.cover_url) : null,
          episodes: Number(story.episodes || 0),
          duration: String(story.duration || "--"),
          plays: String(story.plays || "0"),
          real_views: Number(story.real_views ?? story.plays ?? 0),
          base_fake_views: Number(story.base_fake_views ?? story.plays ?? 0),
          status: String(story.status || "Đang cập nhật"),
        }))
        setStories(normalizedStories)
        setLoading(false)
      } catch (error: unknown) {
        toast.error(`Lỗi: ${error instanceof Error ? error.message : "Không tải được dữ liệu."}`)
        setLoading(false)
      }
    }
    fetchStories()
    return () => {}
  }, [])

  // ... rest of the component remains the same (search, filter, pagination logic)

  const filteredStories = useMemo(() => stories.filter((story) => {
    const query = (submittedSearch || searchTerm).trim().toLowerCase()
    const haystack = [story.title, story.author, story.genre, story.description].join(" ").toLowerCase()
    const matchesSearch = !query || haystack.includes(query)
    const matchesGenre = selectedGenres.includes("Tất cả") || selectedGenres.some((genre) => genresFor(story.genre).includes(genre))
    return matchesSearch && matchesGenre
  }), [stories, searchTerm, submittedSearch, selectedGenres])

  const totalPages = Math.ceil(filteredStories.length / pageSize)
  const pageStories = filteredStories.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F9FA] to-[#E8EAED] dark:from-[#0F172A] dark:to-[#1E2937]">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Header section - search and filters remain as client component */}
        {/* ... rest of the UI code ... */}
      </main>
      <Footer />
    </div>
  )
}