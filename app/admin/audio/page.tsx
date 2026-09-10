"use client"

import { useEffect, useRef, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Download, Edit, Lock, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AudioFormDialog, type StoryFormValues } from "@/components/admin/audio-form-dialog"
import { ImportStoriesDialog } from "@/components/admin/import-stories-dialog"
import { supabase, type Episode } from "@/lib/supabase"
import {
  formatEpisodeDuration,
  formatTotalDuration,
  isEmptyDuration,
  sumDurationSeconds,
} from "@/lib/duration"

interface Audio {
  id: number
  slug: string | null
  title: string
  author: string
  genre: string
  description: string
  audio_url: string
  cover_url: string | null
  episodes: number
  duration: string
  plays: string
  status: string
  episodes_list?: Episode[]
}

function formatTotalDurationFromEpisodes(episodes: Array<{ duration?: string | number | null }>): string {
  const totalSeconds = sumDurationSeconds(episodes.map((episode) => episode.duration))
  return formatEpisodeDuration(totalSeconds)
}

export default function AudioPage() {
  const [audioList, setAudioList] = useState<Audio[]>([])
  const [loading, setLoading] = useState(true)
  const [editingStory, setEditingStory] = useState<StoryFormValues | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const backfillStarted = useRef(false)

  const fetchAudios = async () => {
    setLoading(true)
    try {
      const { data: stories, error } = await supabase
        .from("stories")
        .select("*")
        .order("id", { ascending: false })

      if (error) throw error

      const { data: episodes, error: episodesError } = await supabase
        .from("episodes")
        .select("id, story_id, episode_number, title, audio_url, duration")
        .order("episode_number")

      if (episodesError) throw episodesError

      const episodesByStory = new Map<number, Episode[]>()
      for (const episode of (episodes || []) as Episode[]) {
        const storyId = Number(episode.story_id)
        const items = episodesByStory.get(storyId) || []
        items.push(episode)
        episodesByStory.set(storyId, items)
      }

      const normalizedStories = ((stories || []) as Audio[]).map((story) => {
        const episodesForStory = episodesByStory.get(Number(story.id)) || []
        return {
          ...story,
          episodes: episodesForStory.length || story.episodes,
          duration: formatTotalDurationFromEpisodes(episodesForStory),
          episodes_list: episodesForStory,
        }
      })

      setAudioList(normalizedStories)
      return normalizedStories
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không tải được dữ liệu."
      toast.error(`Lỗi tải dữ liệu: ${message}`)
      return []
    } finally {
      setLoading(false)
    }
  }

  const backfillDurations = async (stories: Audio[]) => {
    let updatedStories = 0

    for (const story of stories) {
      const totalDuration = formatTotalDurationFromEpisodes(story.episodes_list || [])
      const { error } = await supabase
        .from("stories")
        .update({ duration: totalDuration === "--" ? null : totalDuration })
        .eq("id", story.id)

      if (!error) updatedStories += 1
    }

    if (updatedStories > 0) {
      toast.success(`Đã đồng bộ thời lượng cho ${updatedStories} truyện từ dữ liệu các tập.`)
      await fetchAudios()
    }
  }

  const handleRefresh = () => {
    void fetchAudios()
  }

  const handleDelete = async (audio: Audio) => {
    if (!window.confirm(`Bạn có chắc muốn xóa truyện "${audio.title}" và toàn bộ tập audio không?`)) return

    try {
      const response = await fetch("/api/admin/stories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: audio.id }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || "Không thể xóa truyện.")

      toast.success("Đã xóa truyện và toàn bộ tập audio.")
      await fetchAudios()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể xóa truyện."
      toast.error(`Lỗi xóa truyện: ${message}`)
    }
  }

  const handleEdit = (audio: Audio) => {
    setEditingStory({
      id: audio.id,
      slug: audio.slug,
      title: audio.title,
      author: audio.author,
      genre: audio.genre,
      description: audio.description,
      audio_url: audio.audio_url,
      cover_url: audio.cover_url,
      status: audio.status,
      plays: audio.plays,
      duration: audio.duration,
    })
    setEditOpen(true)
  }

  const handleEditOpenChange = (open: boolean) => {
    setEditOpen(open)
    if (!open) {
      setEditingStory(null)
    }
  }

  useEffect(() => {
    const run = async () => {
      const stories = await fetchAudios()
      if (backfillStarted.current) return
      backfillStarted.current = true
      const needsBackfill = stories.some((story) =>
        (story.episodes_list || []).some((episode) => isEmptyDuration(episode.duration))
        || (story.episodes_list || []).length > 0 && (story.duration === "--" || isEmptyDuration(story.duration))
      )
      if (needsBackfill) {
        await backfillDurations(stories)
      }
    }
    void run()
  }, [])

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Quản lý Audio</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleRefresh}>Làm mới</Button>
            <Button variant="outline" nativeButton={false} render={<a href="/mau-import-truyen.csv" download="mau-import-truyen.csv" />}>
              <Download className="mr-2 h-4 w-4" />
              Tải file mẫu
            </Button>
            <ImportStoriesDialog onSuccess={handleRefresh} />
            <AudioFormDialog onSuccess={handleRefresh} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Input placeholder="Tìm kiếm truyện, tác giả..." className="max-w-xs" />
          <Button variant="outline">Lọc</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên truyện</TableHead>
              <TableHead>Thể loại</TableHead>
              <TableHead>Số tập</TableHead>
              <TableHead>Thời lượng</TableHead>
              <TableHead>Lượt nghe</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-32">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : audioList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Chưa có truyện nào. Bấm &quot;+ Thêm truyện&quot; để bắt đầu.
                </TableCell>
              </TableRow>
            ) : (
              audioList.map((audio) => (
                <TableRow key={audio.id}>
                  <TableCell className="font-medium">{audio.title}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {audio.genre?.split(",").map((g) => g.trim()).filter(Boolean).map((genre, idx) => (
                        <Badge key={idx} variant="outline">{genre}</Badge>
                      )) || <Badge variant="outline">Khác</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{audio.episodes_list?.length || audio.episodes || 0}</TableCell>
                  <TableCell>{formatTotalDurationFromEpisodes(audio.episodes_list || [])}</TableCell>
                  <TableCell>{audio.plays}</TableCell>
                  <TableCell>
                    <Badge variant={audio.status === "Đang cập nhật" ? "default" : "secondary"}>
                      {audio.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" title="Sửa" aria-label="Sửa" onClick={() => handleEdit(audio)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Khóa" aria-label="Khóa"><Lock className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" title="Xóa" aria-label="Xóa" onClick={() => handleDelete(audio)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <AudioFormDialog
          story={editingStory ? { ...editingStory, episodes: audioList.find((audio) => audio.id === editingStory.id)?.episodes_list } : null}
          open={editOpen}
          onOpenChange={handleEditOpenChange}
          onSuccess={handleRefresh}
        />
      </div>
    </AdminShell>
  )
}