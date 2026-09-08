"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

function asNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function AdminStats() {
  const [statsData, setStatsData] = useState({
    storyCount: 0,
    realViews: 0,
    totalViews: 0,
    totalEpisodes: 0,
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [storiesRes, episodesRes] = await Promise.all([
          supabase.from("stories").select("plays, real_views, base_fake_views"),
          supabase.from("episodes").select("id"),
        ])

        const storiesError = storiesRes.error
        const storiesMissingViewColumns =
          Boolean(storiesError) && /real_views|base_fake_views|column .* does not exist/i.test(storiesError?.message || "")

        const stories = storiesMissingViewColumns
          ? ((await supabase.from("stories").select("plays")).data || [])
          : storiesRes.data || []

        if (!storiesMissingViewColumns && storiesError) throw storiesError
        if (episodesRes.error) throw episodesRes.error

        const realViews = stories.reduce((sum, story) => {
          const row = story as { real_views?: unknown; plays?: unknown }
          return sum + (row.real_views !== undefined ? asNumber(row.real_views) : asNumber(row.plays))
        }, 0)

        const totalViews = stories.reduce((sum, story) => {
          const row = story as { real_views?: unknown; base_fake_views?: unknown; plays?: unknown }
          if (row.real_views !== undefined || row.base_fake_views !== undefined) {
            return sum + asNumber(row.real_views) + asNumber(row.base_fake_views)
          }
          return sum + asNumber(row.plays)
        }, 0)

        setStatsData({
          storyCount: stories.length,
          realViews,
          totalViews,
          totalEpisodes: (episodesRes.data || []).length,
        })
        setError(null)
      } catch (error: unknown) {
        const details =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: unknown }).message)
            : error instanceof Error
              ? error.message
              : "Không thể lấy dữ liệu thống kê"
        console.error("Lỗi lấy thống kê:", details)
        setError(details)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Truyện audio</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{statsData.storyCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Tổng số truyện trong hệ thống</p>
          {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Lượt nghe thực</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{statsData.realViews.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted-foreground">Lượt nghe thật từ người dùng</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Tổng lượt nghe</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{statsData.totalViews.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted-foreground">Lượt nghe thực + ảo</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Tổng tập audio</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{statsData.totalEpisodes.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted-foreground">Tổng số tập trong hệ thống</p>
        </CardContent>
      </Card>
    </div>
  )
}

