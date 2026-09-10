"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type Story = {
  id: number
  title: string
  genre?: string | null
  status?: string | null
  realViews: number
  fakeViews: number
}

type GenreStat = {
  genre: string
  stories: number
  realViews: number
  fakeViews: number
  activeReal: number
  activeFake: number
}

type AffiliateLink = {
  id: number
  title: string
  url: string
  image_url: string | null
  clicks: number
  is_active: boolean
}

type DatePreset = "all" | "this-month" | "last-month" | "custom"

const REAL_VIEWS_COLOR = "#EE4D2D"
const FAKE_VIEWS_COLOR = "#689EC2"
const HIGHLIGHT_COLOR = "#EE4D2D"

const numberValue = (value: unknown) => (Number.isFinite(Number(value)) ? Number(value) : 0)

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="h-[320px]">{children}</div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [genreStats, setGenreStats] = useState<GenreStat[]>([])
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([])
  const [metrics, setMetrics] = useState({
    totalStories: 0,
    totalEpisodes: 0,
    totalMembers: 0,
    totalVisits: 0,
    realViews: 0,
    fakeViews: 0,
    activeRealListeners: 0,
    activeFakeListeners: 0,
    affiliateRate: 0,
    retentionRate: 0,
  })
  const [datePreset, setDatePreset] = useState<DatePreset>("all")
  const [customDate, setCustomDate] = useState("")
  const [loading, setLoading] = useState(true)

  const dateRange = useMemo(() => {
    if (datePreset === "custom" && customDate) {
      const start = new Date(`${customDate}T00:00:00`)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      return { from: start.toISOString(), to: end.toISOString() }
    }
    if (datePreset === "this-month" || datePreset === "last-month") {
      const now = new Date()
      const offset = datePreset === "last-month" ? -1 : 0
      return {
        from: new Date(now.getFullYear(), now.getMonth() + offset, 1).toISOString(),
        to: new Date(now.getFullYear(), now.getMonth() + offset + 1, 1).toISOString(),
      }
    }
    return { from: "", to: "" }
  }, [datePreset, customDate])

  useEffect(() => {
    const load = async () => {
      try {
        const query = dateRange.from
          ? `?from=${encodeURIComponent(dateRange.from)}&to=${encodeURIComponent(dateRange.to)}`
          : ""
        const response = await fetch(`/api/admin/analytics${query}`, { cache: "no-store" })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload?.error || "Không tải được dữ liệu analytics")
        setStories(payload.stories || [])
        setGenreStats(payload.genreStats || [])
        setAffiliateLinks(payload.affiliateLinks || [])
        setMetrics({
          totalStories: numberValue(payload.metrics?.totalStories),
          totalEpisodes: numberValue(payload.metrics?.totalEpisodes),
          totalMembers: numberValue(payload.metrics?.totalMembers),
          totalVisits: numberValue(payload.metrics?.totalVisits),
          realViews: numberValue(payload.metrics?.realViews),
          fakeViews: numberValue(payload.metrics?.fakeViews),
          activeRealListeners: numberValue(payload.metrics?.activeRealListeners),
          activeFakeListeners: numberValue(payload.metrics?.activeFakeListeners),
          affiliateRate: numberValue(payload.metrics?.affiliateRate),
          retentionRate: numberValue(payload.metrics?.retentionRate),
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Lỗi tải dữ liệu analytics")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [dateRange])

  const storyTop5 = useMemo(
    () => [...stories].sort((a, b) => b.realViews + b.fakeViews - (a.realViews + a.fakeViews)).slice(0, 5),
    [stories],
  )
  const genreCountData = useMemo(
    () => genreStats.map((item) => ({ name: item.genre, value: item.stories })),
    [genreStats],
  )
  const genreRealData = useMemo(
    () => genreStats.map((item) => ({ name: item.genre, value: item.realViews })),
    [genreStats],
  )
  const viewsChartData = useMemo(
    () =>
      genreStats.map((item) => ({
        genre: item.genre,
        realViews: numberValue(item.realViews),
        fakeViews: numberValue(item.fakeViews),
      })),
    [genreStats],
  )
  const activeChartData = useMemo(
    () =>
      genreStats.map((item) => ({
        genre: item.genre,
        activeReal: numberValue(item.activeReal),
        activeFake: numberValue(item.activeFake),
      })),
    [genreStats],
  )

  const maxGenreCount = useMemo(
    () => Math.max(0, ...genreCountData.map((item) => item.value)),
    [genreCountData],
  )
  const maxGenreReal = useMemo(
    () => Math.max(0, ...genreRealData.map((item) => item.value)),
    [genreRealData],
  )

  const downloadCSV = () => {
    const rows = [
      ["ID", "Tên truyện", "Thể loại", "Real Views", "Fake Views", "Total Views"],
      ...storyTop5.map((story) => [
        story.id,
        story.title,
        story.genre || "",
        story.realViews,
        story.fakeViews,
        story.realViews + story.fakeViews,
      ]),
    ]
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n")
    const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "bao-cao-thong-ke.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <AdminShell>
        <div className="p-8">Đang tải dữ liệu...</div>
      </AdminShell>
    )
  }

  const metricCards = [
    { label: "Tổng truyện", value: metrics.totalStories.toLocaleString(), detail: "Count stories", highlight: false },
    { label: "Tổng tập", value: metrics.totalEpisodes.toLocaleString(), detail: "Count episodes", highlight: false },
    { label: "Tổng thành viên", value: metrics.totalMembers.toLocaleString(), detail: "Count users", highlight: false },
    { label: "Tổng lượt truy cập", value: metrics.totalVisits.toLocaleString(), detail: "Unique IPs", highlight: false },
    { label: "Lượt nghe thực", value: metrics.realViews.toLocaleString(), detail: "SUM realViews", highlight: true },
    { label: "Lượt nghe ảo", value: metrics.fakeViews.toLocaleString(), detail: "SUM fakeViews", highlight: false },
    { label: "Đang nghe thực", value: metrics.activeRealListeners.toLocaleString(), detail: "15 phút gần nhất", highlight: true },
    { label: "Đang nghe ảo", value: metrics.activeFakeListeners.toLocaleString(), detail: "Social proof 15–85", highlight: false },
    { label: "Tỷ lệ nhấp Affiliate", value: `${metrics.affiliateRate.toFixed(2)}%`, detail: "Clicks / real views", highlight: true },
    { label: "Tỷ lệ quay lại", value: `${metrics.retentionRate.toFixed(2)}%`, detail: "IP xuất hiện > 1 lần", highlight: true },
  ]

  return (
    <AdminShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Thống kê &amp; Báo cáo</h1>
            <p className="text-sm text-muted-foreground">Dữ liệu realtime từ Supabase service role</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={datePreset}
              onChange={(event) => setDatePreset(event.target.value as DatePreset)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="this-month">Tháng này</option>
              <option value="last-month">Tháng trước</option>
              <option value="custom">Theo ngày</option>
            </select>
            {datePreset === "custom" && (
              <Input type="date" value={customDate} onChange={(event) => setCustomDate(event.target.value)} className="w-40" />
            )}
            <Button variant="outline" onClick={downloadCSV}>
              <Download className="mr-2 h-4 w-4" />
              Xuất CSV
            </Button>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">1. Bảng thông số</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {metricCards.map((card) => (
              <div key={card.label} className="rounded-xl border bg-card p-4">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className={`mt-2 text-2xl font-bold ${card.highlight ? "text-[#EE4D2D]" : "text-foreground"}`}>
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">2. Biểu đồ</h2>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard title="Lượt nghe thực vs ảo theo thể loại">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="genre" />
                  <YAxis yAxisId="real" orientation="left" allowDecimals={false} />
                  <YAxis yAxisId="fake" orientation="right" allowDecimals={false} />
                  <Tooltip cursor={false} />
                  <Legend />
                  <Bar yAxisId="real" dataKey="realViews" fill={REAL_VIEWS_COLOR} name="Lượt nghe thực" minPointSize={4} />
                  <Bar yAxisId="fake" dataKey="fakeViews" fill={FAKE_VIEWS_COLOR} name="Lượt nghe ảo" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Đang nghe thực vs ảo theo thể loại">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="genre" />
                  <YAxis yAxisId="activeReal" orientation="left" allowDecimals={false} />
                  <YAxis yAxisId="activeFake" orientation="right" allowDecimals={false} />
                  <Tooltip cursor={false} />
                  <Legend />
                  <Bar yAxisId="activeReal" dataKey="activeReal" fill={REAL_VIEWS_COLOR} name="Đang nghe thực" minPointSize={4} />
                  <Bar yAxisId="activeFake" dataKey="activeFake" fill={FAKE_VIEWS_COLOR} name="Đang nghe ảo" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Phân bố thể loại theo số truyện">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genreCountData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip cursor={false} />
                  <Legend />
                  <Bar dataKey="value" name="Số truyện">
                    {genreCountData.map((item) => (
                      <Cell
                        key={`count-${item.name}`}
                        fill={item.value === maxGenreCount ? HIGHLIGHT_COLOR : FAKE_VIEWS_COLOR}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Phân bố thể loại theo lượt nghe thực">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genreRealData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip cursor={false} />
                  <Legend />
                  <Bar dataKey="value" name="Lượt nghe thực">
                    {genreRealData.map((item) => (
                      <Cell
                        key={`real-${item.name}`}
                        fill={item.value === maxGenreReal ? HIGHLIGHT_COLOR : FAKE_VIEWS_COLOR}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">3. Bảng top</h2>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border bg-card p-4">
              <h3 className="mb-4 font-semibold">Top 5 truyện có lượt nghe cao nhất</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>STT</TableHead>
                    <TableHead>Tên truyện</TableHead>
                    <TableHead>Thể loại</TableHead>
                    <TableHead>Real</TableHead>
                    <TableHead>Fake</TableHead>
                    <TableHead>Tổng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storyTop5.map((story, index) => (
                    <TableRow key={story.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{story.title}</TableCell>
                      <TableCell>{story.genre || "Khác"}</TableCell>
                      <TableCell>{story.realViews.toLocaleString()}</TableCell>
                      <TableCell>{story.fakeViews.toLocaleString()}</TableCell>
                      <TableCell>{(story.realViews + story.fakeViews).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <h3 className="mb-4 font-semibold">Top link Shopee click nhiều nhất</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ảnh</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliateLinks.slice(0, 5).map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        {link.image_url ? (
                          <img src={link.image_url} alt={link.title} className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <ExternalLink className="h-5 w-5" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{link.title}</TableCell>
                      <TableCell className="max-w-40 truncate text-xs">{link.url || "—"}</TableCell>
                      <TableCell>{link.clicks.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={link.is_active ? "default" : "outline"}>
                          {link.is_active ? "Bật" : "Tắt"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  )
}
