"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Check, Loader2, Plus, Trash2 } from "lucide-react"
import { supabase, type Episode } from "@/lib/supabase"
import { getCategoryOptions } from "@/lib/category-options"
import {
  formatEpisodeDuration,
  formatTotalDuration,
  loadAudioDuration,
  parseDurationSeconds,
  sumDurationSeconds,
} from "@/lib/duration"

export interface StoryFormValues {
  id?: number
  slug?: string | null
  title?: string | null
  author?: string | null
  genre?: string | null
  description?: string | null
  audio_url?: string | null
  cover_url?: string | null
  text_url?: string | null
  status?: string | null
  plays?: string | null
  duration?: string | null
  episodes?: Episode[]
}

interface AudioFormDialogProps {
  story?: StoryFormValues | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

const fallbackGenreNames: string[] = []
const statuses = ["Đang cập nhật", "Hoàn thành"]
const emptyForm = { title: "", author: "", genre: "", description: "", cover_url: "", text_url: "", status: "Đang cập nhật" }
const emptyEpisode = { episode_number: 1, title: "", audio_url: "", duration: "" }
type EpisodeForm = typeof emptyEpisode

export function AudioFormDialog({ story = null, open: controlledOpen, onOpenChange, onSuccess }: AudioFormDialogProps) {
  const isControlled = controlledOpen !== undefined
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [episodeForms, setEpisodeForms] = useState<EpisodeForm[]>([emptyEpisode])
  const [genreOptions, setGenreOptions] = useState(fallbackGenreNames)
  const [detectingIndexes, setDetectingIndexes] = useState<number[]>([])
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const isEditing = Boolean(story?.id)
  const detectTimers = useRef<Record<number, number>>({})
  const detectRequests = useRef(0)

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) setUncontrolledOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  useEffect(() => {
    if (!open) return
    setFormData({
      title: story?.title ?? "",
      author: story?.author ?? "",
      genre: story?.genre ?? "",
      description: story?.description ?? "",
      cover_url: story?.cover_url ?? "",
      text_url: story?.text_url ?? "",
      status: story?.status || "Đang cập nhật",
    })
    setEpisodeForms(story?.episodes?.length
      ? story.episodes.map(({ episode_number, title, audio_url, duration }) => ({
          episode_number,
          title,
          audio_url,
          duration: duration && parseDurationSeconds(duration) > 0 ? duration : "",
        }))
      : [{ ...emptyEpisode, audio_url: story?.audio_url ?? "" }])
  }, [open, story])

  useEffect(() => {
    if (!open) return
    const loadGenres = async () => {
      const options = await getCategoryOptions()
      setGenreOptions(options.map((category) => category.name))
    }
    void loadGenres()
  }, [open])

  useEffect(() => {
    return () => {
      Object.values(detectTimers.current).forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const updateEpisode = (index: number, patch: Partial<EpisodeForm>) => {
    setEpisodeForms((items) => items.map((item, i) => i === index ? { ...item, ...patch } : item))
  }

  const detectDuration = async (index: number, url: string, { silent = false } = {}) => {
    const trimmed = url.trim()
    if (!trimmed) return
    const requestId = ++detectRequests.current
    setDetectingIndexes((items) => items.includes(index) ? items : [...items, index])
    try {
      const seconds = await loadAudioDuration(trimmed)
      if (requestId !== detectRequests.current) return
      updateEpisode(index, { duration: formatEpisodeDuration(seconds) })
    } catch (error) {
      if (!silent) {
        const message = error instanceof Error ? error.message : "Không đọc được thời lượng."
        toast.error(`${message} Hãy nhập tay, ví dụ 41:36.`)
      }
    } finally {
      setDetectingIndexes((items) => items.filter((item) => item !== index))
    }
  }

  const scheduleDurationDetect = (index: number, url: string) => {
    window.clearTimeout(detectTimers.current[index])
    detectTimers.current[index] = window.setTimeout(() => {
      void detectDuration(index, url, { silent: true })
    }, 600)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    const validEpisodes = episodeForms.filter((episode) => episode.audio_url.trim())
    if (validEpisodes.length === 0) {
      toast.error("Hãy nhập ít nhất một link audio cho tập.")
      setLoading(false)
      return
    }
    const resolvedEpisodes = validEpisodes.map((episode) => {
      const manualDuration = episode.duration.trim()
      return { ...episode, duration: manualDuration }
    })
    const totalDuration = formatTotalDuration(sumDurationSeconds(resolvedEpisodes.map((episode) => episode.duration)))
    const payload = {
      title: formData.title.trim(),
      author: formData.author.trim(),
      genre: formData.genre,
      description: formData.description.trim(),
      audio_url: resolvedEpisodes[0].audio_url.trim(),
      cover_url: formData.cover_url.trim() || null,
      text_url: formData.text_url.trim() || null,
      status: formData.status,
      episodes: resolvedEpisodes.length,
      duration: totalDuration === "--" ? null : totalDuration,
    }

    try {
      const { data: storyData, error } = isEditing
        ? await supabase.from("stories").update(payload).eq("id", story!.id!).select()
        : await supabase.from("stories").insert([{ ...payload, plays: "0" }]).select()

      if (error && /text_url/i.test(error.message)) {
        toast.error("Chưa có cột text_url trên Supabase. Chạy SQL trong tab SQL Editor:\n\nALTER TABLE public.stories ADD COLUMN IF NOT EXISTS text_url TEXT;")
      }
      if (error) throw error
      const storyId = isEditing ? story!.id! : storyData?.[0]?.id
      if (!storyId) throw new Error("Không lấy được ID bộ truyện.")

      const { error: deleteError } = await supabase.from("episodes").delete().eq("story_id", storyId)
      if (deleteError) throw deleteError
      const records = resolvedEpisodes.map((episode, index) => {
        const seconds = parseDurationSeconds(episode.duration)
        return {
          story_id: storyId,
          episode_number: episode.episode_number || index + 1,
          title: episode.title.trim() || `Tập ${index + 1}`,
          audio_url: episode.audio_url.trim(),
          duration: episode.duration.trim(),
        }
      })
      const { error: episodeError } = await supabase.from("episodes").insert(records)
      if (episodeError) throw episodeError

      toast.success(isEditing ? "Cập nhật truyện thành công!" : "Thêm truyện thành công!")
      setOpen(false)
      setFormData(emptyForm)
      setEpisodeForms([emptyEpisode])
      onSuccess?.()
    } catch (error: unknown) {
      console.error("Form submit error:", error)
      const message = error && typeof error === "object" && "message" in error ? String(error.message) : "Không lưu được truyện."
      toast.error(`Lỗi: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" />Thêm truyện</Button>} />}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Sửa truyện" : "Thêm truyện mới"}</DialogTitle>
          <DialogDescription>{isEditing ? "Cập nhật thông tin truyện audio đã đăng." : "Điền thông tin để thêm truyện audio mới vào kho."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="title">Tên truyện</Label><Input id="title" value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))} required /></div>
          <div className="space-y-2"><Label htmlFor="author">Tác giả</Label><Input id="author" value={formData.author} onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))} required /></div>
          <div className="space-y-2">
            <Label>Thể loại (chọn nhiều)</Label>
            <div className="flex flex-wrap gap-2 rounded-md border p-2">
              {genreOptions.map((genre) => {
                const selected = formData.genre.split(",").map((item) => item.trim()).includes(genre)
                return <Button key={genre} type="button" size="sm" variant={selected ? "default" : "outline"} onClick={() => setFormData((prev) => {
                  const values = prev.genre.split(",").map((item) => item.trim()).filter(Boolean)
                  return { ...prev, genre: selected ? values.filter((item) => item !== genre).join(", ") : [...values, genre].join(", ") }
                })}>{selected && <Check className="mr-1 h-3 w-3" />}{genre}</Button>
              })}
            </div>
          </div>
          <div className="space-y-2"><Label htmlFor="status">Trạng thái</Label><Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value || statuses[0] }))}><SelectTrigger id="status"><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger><SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="description">Mô tả ngắn</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} rows={3} required /></div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label>Danh sách tập</Label><Button type="button" variant="outline" size="sm" onClick={() => setEpisodeForms((items) => [...items, { ...emptyEpisode, episode_number: items.length + 1 }])}>+ Thêm tập mới</Button></div>
            <div className="space-y-2 rounded-md border p-2">
              {episodeForms.map((episode, index) => (
                <div key={index} className="grid grid-cols-[50px_1fr_auto] gap-2">
                  <Input type="number" min={1} aria-label={`Số tập ${index + 1}`} value={episode.episode_number} onChange={(e) => updateEpisode(index, { episode_number: Number(e.target.value) })} />
                  <div className="space-y-1">
                    <Input placeholder="Tên tập" value={episode.title} onChange={(e) => updateEpisode(index, { title: e.target.value })} />
                    <Input
                      placeholder="https://...r2.dev/tap-01.mp3"
                      value={episode.audio_url}
                      onChange={(e) => {
                        const url = e.target.value
                        updateEpisode(index, { audio_url: url })
                        scheduleDurationDetect(index, url)
                      }}
                      onBlur={() => void detectDuration(index, episode.audio_url, { silent: true })}
                      required
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Thời lượng (tùy chọn, vd 41:36)"
                        value={episode.duration}
                        onChange={(e) => updateEpisode(index, { duration: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!episode.audio_url.trim() || detectingIndexes.includes(index)}
                        onClick={() => void detectDuration(index, episode.audio_url)}
                      >
                        {detectingIndexes.includes(index) ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đọc"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Dán link R2 sẽ tự đọc thời lượng. Nếu không được, nhập tay rồi lưu.
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setEpisodeForms((items) => items.length > 1 ? items.filter((_, i) => i !== index) : items)} disabled={episodeForms.length === 1} className="self-start text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2"><Label htmlFor="cover_url">Link Cover (tùy chọn)</Label><Input id="cover_url" value={formData.cover_url} onChange={(e) => setFormData((prev) => ({ ...prev, cover_url: e.target.value }))} placeholder="https://pub-xxx.r2.dev/cover.jpg" /></div>
          <div className="space-y-2">
            <Label htmlFor="text_url">Link truyện chữ (tùy chọn)</Label>
            <Input
              id="text_url"
              value={formData.text_url}
              onChange={(e) => setFormData((prev) => ({ ...prev, text_url: e.target.value }))}
              placeholder="Để trống sẽ dẫn về trang audio của truyện này"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={loading}>{loading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Lưu truyện"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
