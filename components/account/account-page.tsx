"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ImageWithFallback } from "@/components/image-with-fallback"
import { formatClockDuration } from "@/lib/duration"
import { slugify } from "@/lib/slug"
import { LogOut, Headphones, Clock, Play } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface AccountPageProps {
  user: { email: string; createdAt: string; metadata: Record<string, unknown> }
}

interface FavoriteItem {
  story_id: number
  created_at: string
  stories: {
    id: number
    title: string
    slug: string | null
    author: string
    cover_url: string | null
    genre: string
    episodes: number
    duration: string
  }
}

interface HistoryItem {
  id: number
  story_id: number
  episode_id: number | null
  progress_seconds: number
  duration_seconds: number
  completed: boolean
  last_played_at: string
  stories: { id: number; title: string; slug: string | null; cover_url: string | null } | null
  episodes: { id: number; episode_number: number; title: string; duration: string } | null
}

export function AccountPage({ user }: AccountPageProps) {
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loadingFavorites, setLoadingFavorites] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    async function loadFavorites() {
      try {
        const response = await fetch("/api/favorites")
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Không tải được danh sách yêu thích")
        setFavorites(data.favorites || [])
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Không tải được danh sách yêu thích")
      } finally {
        setLoadingFavorites(false)
      }
    }
    async function loadHistory() {
      try {
        const response = await fetch("/api/listening-history")
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Không tải được lịch sử nghe")
        setHistory(data.history || [])
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Không tải được lịch sử nghe")
      } finally {
        setLoadingHistory(false)
      }
    }
    void loadFavorites()
    void loadHistory()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success("Đã đăng xuất")
    router.push("/")
    router.refresh()
  }

  const displayName = (user.metadata.full_name as string | undefined) || (user.metadata.name as string | undefined) || user.email.split("@")[0]
  const avatarUrl = (user.metadata.avatar_url as string | undefined) || (user.metadata.picture as string | undefined)
  const memberSince = new Date(user.createdAt).toLocaleDateString("vi-VN", { year: "numeric", month: "long" })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tài khoản của bạn</h1>
          <p className="mt-1 text-muted-foreground">Quản lý thông tin cá nhân, audio đã lưu và lịch sử nghe</p>
        </div>
        <Button variant="outline" onClick={() => void handleSignOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </Button>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
          <TabsTrigger value="favorites">
            Audio đã lưu <Badge className="ml-2" variant="secondary">{favorites.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="history">
            Lịch sử nghe <Badge className="ml-2" variant="secondary">{history.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card className="p-6">
            <div className="flex items-start gap-6">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-semibold">{displayName[0]?.toUpperCase()}</div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{displayName}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                <p className="mt-2 text-sm text-muted-foreground">Thành viên từ {memberSince}</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          {loadingFavorites ? (
            <p className="text-center text-muted-foreground">Đang tải...</p>
          ) : favorites.length === 0 ? (
            <Card className="p-12 text-center">
              <Headphones className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">Chưa có audio nào được lưu</p>
              <p className="mt-1 text-sm text-muted-foreground">Bấm nút yêu thích khi nghe truyện để thêm vào đây</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {favorites.map((fav) => {
                const story = fav.stories
                const storyUrl = `/track/${story.slug || story.id}`
                return (
                  <Link key={fav.story_id} href={storyUrl} className="block">
                    <Card className="p-4 transition-colors hover:bg-accent">
                      <div className="flex items-center gap-4">
                        <ImageWithFallback src={story.cover_url || ""} alt={story.title} className="h-20 w-20 rounded object-cover" />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-semibold text-[#154B95]">{story.title}</h3>
                          <p className="text-sm text-muted-foreground">{story.author} • {story.episodes} tập</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {story.genre?.split(",").map((g) => g.trim()).filter(Boolean).map((genre, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{genre}</Badge>
                            ))}
                            <span className="text-xs text-muted-foreground">• {formatClockDuration(story.duration)}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {loadingHistory ? (
            <p className="text-center text-muted-foreground">Đang tải...</p>
          ) : history.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">Chưa có lịch sử nghe</p>
              <p className="mt-1 text-sm text-muted-foreground">Bắt đầu nghe truyện để theo dõi tiến độ tại đây</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const story = item.stories
                const episode = item.episodes
                if (!story) return null
                const storyUrl = `/track/${story.slug || story.id}`
                const progressPercent = item.duration_seconds > 0 ? Math.round((item.progress_seconds / item.duration_seconds) * 100) : 0
                const lastPlayed = new Date(item.last_played_at).toLocaleDateString("vi-VN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                return (
                  <Link key={item.id} href={storyUrl} className="block">
                    <Card className="p-4 transition-colors hover:bg-accent">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <ImageWithFallback src={story.cover_url || ""} alt={story.title} className="h-20 w-20 rounded object-cover" />
                          {item.completed && (
                            <div className="absolute inset-0 flex items-center justify-center rounded bg-black/60">
                              <Play className="h-6 w-6 text-white" fill="white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-[#154B95]">{story.title}</h3>
                          {episode && <p className="text-sm text-muted-foreground">Tập {episode.episode_number}: {episode.title}</p>}
                          <div className="mt-2 flex items-center gap-3">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                              <div className="h-full bg-[#EE4D2D]" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{progressPercent}%</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">Nghe lần cuối: {lastPlayed}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
