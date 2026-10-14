"use client"

import { useMemo, useState } from "react"
import { Loader2, Star } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { adminWrite } from "@/lib/admin-db"
import { FEATURED_SLOTS, pickTopStories } from "@/lib/featured"
import { totalViewsFor } from "@/lib/story-views"

type Story = { id: number; title: string; featured_rank?: number | null; real_views?: number | null; base_fake_views?: number | null }

const AUTO = ""

// Chọn 4 truyện ở khu "Được nghe nhiều" trang chủ. Ô "Tự động" lấy truyện nhiều lượt nghe nhất chưa được ghim.
export function FeaturedPicker({ stories, onSaved }: { stories: Story[]; onSaved: () => void }) {
  const columnReady = stories.length === 0 || stories.some((story) => "featured_rank" in story)
  const saved = useMemo(() => {
    const slots: string[] = Array(FEATURED_SLOTS).fill(AUTO)
    for (const story of stories) {
      const rank = Number(story.featured_rank)
      if (rank >= 1 && rank <= FEATURED_SLOTS) slots[rank - 1] = String(story.id)
    }
    return slots
  }, [stories])
  const [draft, setDraft] = useState<string[] | null>(null)
  const [saving, setSaving] = useState(false)
  const slots = draft ?? saved
  const dirty = slots.some((value, index) => value !== saved[index])

  const sorted = useMemo(() => [...stories].sort((a, b) => totalViewsFor(b) - totalViewsFor(a)), [stories])
  const preview = useMemo(() => {
    const ranked = stories.map((story) => {
      const slot = slots.indexOf(String(story.id))
      return { ...story, featured_rank: slot >= 0 ? slot + 1 : null }
    })
    return pickTopStories(ranked)
  }, [stories, slots])

  const choose = (index: number, value: string) => {
    const next = [...slots]
    // Một truyện chỉ đứng một vị trí: chọn lại ở ô khác thì ô cũ về "Tự động".
    if (value !== AUTO) next.forEach((current, i) => { if (current === value) next[i] = AUTO })
    next[index] = value
    setDraft(next)
  }

  const save = async () => {
    setSaving(true)
    try {
      const wanted = new Map(slots.map((value, index) => [value, index + 1]).filter(([value]) => value !== AUTO) as [string, number][])
      // Bỏ ghim trước rồi mới ghim mới, để không có hai truyện cùng một vị trí.
      for (const story of stories) {
        if (story.featured_rank != null && wanted.get(String(story.id)) !== story.featured_rank) {
          const { error } = await adminWrite({ table: "stories", op: "update", values: { featured_rank: null }, match: { id: story.id } })
          if (error) throw new Error(error.message)
        }
      }
      for (const [id, rank] of wanted) {
        if (stories.find((story) => String(story.id) === id)?.featured_rank === rank) continue
        const { error } = await adminWrite({ table: "stories", op: "update", values: { featured_rank: rank }, match: { id: Number(id) } })
        if (error) throw new Error(error.message)
      }
      toast.success("Đã lưu Top 4. Trang chủ cập nhật trong khoảng 1 phút.")
      setDraft(null)
      onSaved()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được Top 4")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Star className="h-4 w-4 text-[#EE4D2D]" />Top 4 trang chủ (&quot;Được nghe nhiều&quot;)</CardTitle>
        <p className="text-sm text-muted-foreground">Chọn truyện cho từng vị trí. Để &quot;Tự động&quot; thì vị trí đó lấy truyện nhiều lượt nghe nhất.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!columnReady ? (
          <p className="rounded-md border border-[#EE4D2D]/40 bg-[#EE4D2D]/10 p-3 text-sm text-[#EE4D2D]">
            Chưa bật được tính năng: chạy file supabase/migrations/20250918_story_featured_rank.sql trong Supabase SQL Editor rồi bấm Làm mới.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {slots.map((value, index) => (
                <label key={index} className="space-y-1.5">
                  <span className="text-sm font-semibold"><span className="text-[#EE4D2D]">#{index + 1}</span> {value === AUTO && preview[index] ? <span className="font-normal text-muted-foreground">— tự động: {preview[index].title}</span> : null}</span>
                  <select
                    value={value}
                    onChange={(event) => choose(index, event.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
                  >
                    <option value={AUTO}>Tự động (theo lượt nghe)</option>
                    {sorted.map((story) => (
                      <option key={story.id} value={String(story.id)}>{story.title} · {totalViewsFor(story).toLocaleString("vi-VN")} lượt</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" disabled={!dirty || saving} onClick={() => void save()}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Lưu Top 4
              </Button>
              {dirty && <Button type="button" variant="ghost" disabled={saving} onClick={() => setDraft(null)}>Hủy thay đổi</Button>}
              <Button type="button" variant="outline" disabled={saving} onClick={() => setDraft(Array(FEATURED_SLOTS).fill(AUTO))}>Tất cả tự động</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
