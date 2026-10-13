"use client"

import { useEffect, useMemo, useState } from "react"
import NextLink from "next/link"
import { Bot, CheckCircle2, ExternalLink, Flag, Loader2, RefreshCw, RotateCcw, Trash2, User } from "lucide-react"
import { toast } from "sonner"
import { AdminShell } from "@/components/admin/admin-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ISSUE_KINDS, isIssueKind } from "@/lib/issue-reports"

type Report = {
  id: number
  story_id: number | null
  episode_id: number | null
  kind: string
  message: string | null
  contact: string | null
  detail: string | null
  page_url: string | null
  user_agent: string | null
  auto: boolean
  status: "new" | "resolved"
  created_at: string
  resolved_at: string | null
  stories: { id: number; title: string } | null
  episodes: { id: number; episode_number: number; title: string; audio_url: string | null } | null
}
type StatusFilter = "new" | "resolved" | "all"

const dateTime = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })

function device(userAgent: string | null) {
  if (!userAgent) return "Không rõ thiết bị"
  const os = /iPhone|iPad/.test(userAgent) ? "iPhone/iPad" : /Android/.test(userAgent) ? "Android" : /Windows/.test(userAgent) ? "Windows" : /Mac OS/.test(userAgent) ? "Mac" : "Khác"
  const browser = /Zalo/i.test(userAgent) ? "Zalo" : /FBAN|FBAV|FB_IAB/.test(userAgent) ? "Facebook" : /Edg\//.test(userAgent) ? "Edge" : /CriOS|Chrome\//.test(userAgent) ? "Chrome" : /Safari\//.test(userAgent) ? "Safari" : /Firefox/.test(userAgent) ? "Firefox" : "trình duyệt khác"
  return `${os} · ${browser}`
}

async function fetchReports(status: StatusFilter) {
  const response = await fetch(`/api/admin/reports?status=${status}`, { cache: "no-store" })
  const data = await response.json()
  if (!response.ok) throw new Error(data.missingTable ? "Chưa có bảng issue_reports trên Supabase — chạy file supabase/migrations/20250917_issue_reports.sql trong SQL Editor." : data.error || "Không tải được báo lỗi")
  return data as { open: number; reports: Report[] }
}

export default function ReportsPage() {
  const [status, setStatus] = useState<StatusFilter>("new")
  const [reports, setReports] = useState<Report[]>([])
  const [open, setOpen] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<number | null>(null)

  const load = (next: StatusFilter = status) => {
    setLoading(true)
    return fetchReports(next)
      .then((data) => { setReports(data.reports); setOpen(data.open); setError(null) })
      .catch((err) => setError(err instanceof Error ? err.message : "Lỗi tải báo lỗi"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchReports("new")
      .then((data) => { setReports(data.reports); setOpen(data.open) })
      .catch((err) => setError(err instanceof Error ? err.message : "Lỗi tải báo lỗi"))
      .finally(() => setLoading(false))
  }, [])

  const changeFilter = (next: StatusFilter) => {
    setStatus(next)
    void load(next)
  }

  const setReportStatus = async (ids: number[], next: "new" | "resolved", key: number) => {
    setBusy(key)
    try {
      const response = await fetch("/api/admin/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, status: next }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Không cập nhật được")
      toast.success(next === "resolved" ? `Đã đánh dấu ${ids.length} báo lỗi là đã xử lý` : "Đã mở lại báo lỗi")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không cập nhật được")
    } finally {
      setBusy(null)
    }
  }

  const remove = async (id: number) => {
    if (!window.confirm("Xóa báo lỗi này? (dùng cho báo lỗi rác)")) return
    setBusy(id)
    const response = await fetch(`/api/admin/reports?id=${id}`, { method: "DELETE" })
    if (response.ok) toast.success("Đã xóa")
    else toast.error("Không xóa được")
    setBusy(null)
    await load()
  }

  // Gom báo lỗi chưa xử lý theo truyện + tập để biết chỗ nào hỏng nhiều nhất.
  const hotspots = useMemo(() => {
    const groups = new Map<string, { label: string; ids: number[]; auto: number }>()
    for (const report of reports) {
      if (report.status !== "new") continue
      const key = `${report.story_id}:${report.episode_id}`
      const label = `${report.stories?.title ?? "Không rõ truyện"}${report.episodes ? ` – Tập ${report.episodes.episode_number}` : ""}`
      const group = groups.get(key) ?? { label, ids: [], auto: 0 }
      group.ids.push(report.id)
      if (report.auto) group.auto += 1
      groups.set(key, group)
    }
    return [...groups.entries()].map(([key, group]) => ({ key, ...group })).sort((a, b) => b.ids.length - a.ids.length).slice(0, 5)
  }, [reports])

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold"><Flag className="h-6 w-6 text-[#EE4D2D]" />Báo lỗi</h1>
            <p className="mt-1 text-sm text-muted-foreground">Người nghe bấm &quot;Báo lỗi&quot; và lỗi audio tự ghi nhận từ trình phát. Đang chờ xử lý: <b className="text-[#EE4D2D]">{open}</b></p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([["new", "Chưa xử lý"], ["resolved", "Đã xử lý"], ["all", "Tất cả"]] as const).map(([value, label]) => (
              <Button key={value} size="sm" variant={status === value ? "default" : "outline"} onClick={() => changeFilter(value)}>{label}</Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => void load()} aria-label="Tải lại"><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </div>

        {error && <p className="rounded-md border border-[#EE4D2D]/40 bg-[#EE4D2D]/10 p-3 text-sm text-[#EE4D2D]">{error}</p>}

        {hotspots.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Chỗ bị báo lỗi nhiều nhất</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {hotspots.map((spot) => (
                <div key={spot.key} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{spot.label}</div>
                    <div className="text-xs text-muted-foreground">{spot.ids.length} báo lỗi{spot.auto ? ` (${spot.auto} tự ghi nhận)` : ""}</div>
                  </div>
                  <Button size="sm" variant="outline" disabled={busy === -spot.ids[0]} onClick={() => void setReportStatus(spot.ids, "resolved", -spot.ids[0])}>
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />Đã sửa cả nhóm
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Đang tải…</p>
        ) : reports.length === 0 && !error ? (
          <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">{status === "new" ? "Không có lỗi nào cần xử lý 🎉" : "Chưa có báo lỗi."}</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <Card key={report.id} className={report.status === "resolved" ? "opacity-70" : ""}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={report.auto ? "bg-[#2D74A8] text-white" : "bg-[#EE4D2D] text-white"}>
                      {report.auto ? <Bot className="mr-1 h-3 w-3" /> : <User className="mr-1 h-3 w-3" />}
                      {isIssueKind(report.kind) ? ISSUE_KINDS[report.kind] : report.kind}
                    </Badge>
                    {report.status === "resolved" && <Badge variant="outline">Đã xử lý {report.resolved_at ? dateTime.format(new Date(report.resolved_at)) : ""}</Badge>}
                    <span className="ml-auto text-xs text-muted-foreground">{dateTime.format(new Date(report.created_at))}</span>
                  </div>

                  <div className="text-sm">
                    <span className="font-semibold">{report.stories?.title ?? "Không rõ truyện"}</span>
                    {report.episodes && <span className="text-muted-foreground"> · Tập {report.episodes.episode_number}: {report.episodes.title}</span>}
                  </div>
                  {report.message && <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{report.message}</p>}
                  <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    {report.contact && <div>Liên hệ: <span className="font-medium text-foreground">{report.contact}</span></div>}
                    <div>Thiết bị: {device(report.user_agent)}</div>
                    {report.detail && <div className="sm:col-span-2">Chi tiết: {report.detail}</div>}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {report.stories && (
                      <Button size="sm" variant="outline" nativeButton={false} render={<a href={report.page_url?.startsWith("/track/") ? report.page_url : `/track/${report.stories.id}`} target="_blank" rel="noreferrer" />}>
                        <ExternalLink className="mr-1.5 h-4 w-4" />Xem trang truyện
                      </Button>
                    )}
                    {report.episodes?.audio_url && (
                      <Button size="sm" variant="outline" nativeButton={false} render={<a href={report.episodes.audio_url} target="_blank" rel="noreferrer" />}>
                        <ExternalLink className="mr-1.5 h-4 w-4" />Mở file audio
                      </Button>
                    )}
                    <Button size="sm" variant="outline" nativeButton={false} render={<NextLink href="/admin/audio" />}>Sửa truyện</Button>
                    {report.status === "new" ? (
                      <Button size="sm" disabled={busy === report.id} onClick={() => void setReportStatus([report.id], "resolved", report.id)}><CheckCircle2 className="mr-1.5 h-4 w-4" />Đã xử lý</Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled={busy === report.id} onClick={() => void setReportStatus([report.id], "new", report.id)}><RotateCcw className="mr-1.5 h-4 w-4" />Mở lại</Button>
                    )}
                    <Button size="sm" variant="ghost" disabled={busy === report.id} onClick={() => void remove(report.id)} aria-label="Xóa báo lỗi"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
