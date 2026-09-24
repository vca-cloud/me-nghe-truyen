"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { PlayCircle } from "lucide-react"
import { slugify } from "@/lib/slug"

interface HistoryItem {
  story_id: number
  progress_seconds: number
  duration_seconds: number
  completed: boolean
  stories: { id: number; title: string } | null
  episodes: { episode_number: number; title: string } | null
}

function formatMinutes(seconds: number) {
  const minutes = Math.max(0, Math.round(seconds / 60))
  return minutes >= 60 ? `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút` : `${minutes} phút`
}

export function ContinueListening() {
  const [items, setItems] = useState<HistoryItem[]>([])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const response = await fetch("/api/listening-history").catch(() => null)
      if (!response?.ok) return
      const data = (await response.json().catch(() => ({}))) as { history?: HistoryItem[] }
      const seen = new Set<number>()
      const latest: HistoryItem[] = []
      for (const row of data.history ?? []) {
        if (seen.has(row.story_id)) continue
        seen.add(row.story_id)
        if (!row.completed && row.stories && row.progress_seconds > 0) latest.push(row)
        if (latest.length === 4) break
      }
      if (!cancelled) setItems(latest)
    })()
    return () => { cancelled = true }
  }, [])

  if (!items.length) return null

  return (
    <section className="mb-12">
      <h2 className="mb-6 text-3xl font-bold">Nghe tiếp</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const percent = item.duration_seconds > 0 ? Math.min(100, (item.progress_seconds / item.duration_seconds) * 100) : 0
          const remaining = Math.max(0, item.duration_seconds - item.progress_seconds)
          return (
            <Link key={item.story_id} href={`/track/${slugify(item.stories!.title) || item.story_id}`} className="block rounded-xl border bg-card p-5 shadow-sm hover:border-primary">
              <div className="flex items-start gap-3">
                <PlayCircle className="mt-1 h-8 w-8 shrink-0 text-[#EE4D2D]" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold text-[#154B95]">{item.stories!.title}</h3>
                  <p className="text-sm text-[#154B95]">
                    {item.episodes ? `Tập ${item.episodes.episode_number}` : "Đang nghe"}
                    {item.duration_seconds > 0 ? ` • còn ${formatMinutes(remaining)}` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#9ECDDD]/50">
                <div className="h-full rounded-full bg-[#EE4D2D]" style={{ width: `${percent}%` }} />
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
