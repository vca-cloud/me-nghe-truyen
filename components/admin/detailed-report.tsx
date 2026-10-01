"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export type DetailedReport = {
  currentMonth: string
  previousMonth: string
  comparedDays: number
  minImpressionsForRate: number
  monthly: { month: string; listens: number; listeners: number; impressions: number; clicks: number; conversionRate: number | null; listensChange: number | null; comparedTo: string | null; isCurrentMonth: boolean }[]
  genres: { genre: string; stories: number; realViewsAll: number; periodListens: number; thisMonth: number; lastMonth: number; impressions: number; clicks: number; avgPerStory: number; monthChange: number | null; clickRate: number | null }[]
  storyAffiliate: { id: number; title: string; genre: string | null; impressions: number; clicks: number; listens: number; clickRate: number | null }[]
}

const REAL = "#EE4D2D"
const BLUE = "#2D74A8"
const TICK = { fill: "currentColor", fontSize: 12 }
const n = (value: number) => value.toLocaleString("vi-VN")
const pct = (value: number | null) => (value == null ? "—" : `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`)
const monthLabel = (month: string) => `${month.slice(5, 7)}/${month.slice(0, 4)}`

function Change({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>
  if (Math.abs(value) < 0.05) return <span className="text-muted-foreground">0%</span>
  const up = value > 0
  return (
    <span className={`font-semibold ${up ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
      {up ? "▲" : "▼"} {Math.abs(value).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%
    </span>
  )
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="font-semibold">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  )
}

export function DetailedReportSection({ report, periodLabel }: { report: DetailedReport | null; periodLabel: string }) {
  const [storySort, setStorySort] = useState<"rate" | "clicks" | "impressions">("rate")

  const genreBadges = useMemo(() => {
    const ranked = (report?.genres ?? []).filter((genre) => genre.stories > 0)
    const size = ranked.length >= 6 ? 3 : ranked.length >= 3 ? 1 : 0
    const top = new Set(ranked.slice(0, size).filter((genre) => genre.avgPerStory > 0).map((genre) => genre.genre))
    const bottom = new Set(ranked.slice(-size).filter((genre) => !top.has(genre.genre)).map((genre) => genre.genre))
    return { top, bottom }
  }, [report])

  const storyRows = useMemo(() => {
    const min = report?.minImpressionsForRate ?? 10
    const rows = [...(report?.storyAffiliate ?? [])]
    const ranked = rows.filter((row) => row.impressions >= min)
    const rest = rows.filter((row) => row.impressions < min)
    const by = (key: "clicks" | "impressions") => (a: (typeof rows)[number], b: (typeof rows)[number]) => b[key] - a[key]
    if (storySort === "rate") {
      ranked.sort((a, b) => (b.clickRate ?? 0) - (a.clickRate ?? 0) || b.impressions - a.impressions)
      rest.sort(by("impressions"))
      return { ranked, rest }
    }
    return { ranked: [...ranked, ...rest].sort(by(storySort)), rest: [] }
  }, [report, storySort])

  if (!report) return null
  const avgChart = report.genres.map((genre) => ({ name: genre.genre, value: Math.round(genre.avgPerStory * 10) / 10 }))
  const monthChart = report.monthly.map((month) => ({ ...month, label: monthLabel(month.month) + (month.isCurrentMonth ? "*" : "") }))
  const min = report.minImpressionsForRate

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">5. Báo cáo chi tiết</h2>
        <p className="text-sm text-muted-foreground">
          Lượt nghe theo tháng tính từ log (có từ 24/09/2026); lượt nghe trước đó chỉ có trong tổng toàn thời gian. Click affiliate theo truyện tính theo kỳ đang chọn: {periodLabel}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <Card title="Lượt nghe thực theo tháng" subtitle="* tháng đang diễn ra, chưa đủ ngày">
            <div className="h-[260px] text-muted-foreground">
              {monthChart.length === 0 ? <p className="text-sm">Chưa có dữ liệu.</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthChart} margin={{ top: 20, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.15} />
                    <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={TICK} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "currentColor", fillOpacity: 0.06 }} formatter={(value) => [n(Number(value)), "Lượt nghe thực"]} />
                    <Bar isAnimationActive={false} dataKey="listens" fill={REAL} radius={[4, 4, 0, 0]} maxBarSize={48}>
                      <LabelList dataKey="listens" position="top" formatter={(value: unknown) => n(Number(value))} style={{ fill: "currentColor", fontSize: 12 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
        <div className="xl:col-span-3">
          <Card title="So sánh từng tháng" subtitle="Tháng đã qua so với tháng liền trước; tháng đang diễn ra so với cùng số ngày đầu tháng trước">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tháng</TableHead>
                  <TableHead className="text-right">Lượt nghe</TableHead>
                  <TableHead className="text-right">Thay đổi</TableHead>
                  <TableHead className="text-right">Người nghe</TableHead>
                  <TableHead className="text-right">Popup</TableHead>
                  <TableHead className="text-right">Click</TableHead>
                  <TableHead className="text-right">Tỷ lệ click</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...report.monthly].reverse().map((month) => (
                  <TableRow key={month.month}>
                    <TableCell className="whitespace-nowrap font-medium">{monthLabel(month.month)}{month.isCurrentMonth && <div className="text-[11px] font-normal text-muted-foreground">đang diễn ra</div>}</TableCell>
                    <TableCell className="text-right font-semibold">{n(month.listens)}</TableCell>
                    <TableCell className="text-right" title={month.comparedTo ? `So với ${month.comparedTo}` : undefined}><Change value={month.listensChange} />{month.comparedTo && <div className="text-[11px] text-muted-foreground">so với {month.comparedTo}</div>}</TableCell>
                    <TableCell className="text-right">{n(month.listeners)}</TableCell>
                    <TableCell className="text-right">{n(month.impressions)}</TableCell>
                    <TableCell className="text-right">{n(month.clicks)}</TableCell>
                    <TableCell className="text-right">{pct(month.conversionRate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      <Card
        title="Hiệu quả thể loại"
        subtitle={`Xếp theo lượt nghe trung bình mỗi truyện (công bằng giữa thể loại nhiều/ít truyện). "Tháng này" là ${report.comparedDays} ngày đầu ${monthLabel(report.currentMonth)}, so với ${report.comparedDays} ngày đầu ${monthLabel(report.previousMonth)}; click affiliate theo kỳ: ${periodLabel}.`}
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <div className="text-muted-foreground xl:col-span-2" style={{ height: Math.max(180, avgChart.length * 34 + 16) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgChart} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 8 }} barCategoryGap={6}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" strokeOpacity={0.15} />
                <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={116} tick={TICK} axisLine={false} tickLine={false} interval={0} />
                <Tooltip cursor={{ fill: "currentColor", fillOpacity: 0.06 }} formatter={(value) => [n(Number(value)), "Lượt nghe TB / truyện"]} />
                <Bar isAnimationActive={false} dataKey="value" fill={BLUE} radius={[0, 4, 4, 0]} maxBarSize={22}>
                  <LabelList dataKey="value" position="right" formatter={(value: unknown) => n(Number(value))} style={{ fill: "currentColor", fontSize: 12 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto xl:col-span-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thể loại</TableHead>
                  <TableHead className="text-right">Truyện</TableHead>
                  <TableHead className="text-right">TB/truyện</TableHead>
                  <TableHead className="text-right">Tổng lượt nghe</TableHead>
                  <TableHead className="text-right">Tháng này</TableHead>
                  <TableHead className="text-right">Cùng kỳ tháng trước</TableHead>
                  <TableHead className="text-right">Thay đổi</TableHead>
                  <TableHead className="text-right">Tỷ lệ click</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.genres.map((genre) => (
                  <TableRow key={genre.genre}>
                    <TableCell className="font-medium">
                      {genre.genre}
                      {genreBadges.top.has(genre.genre) && <span className="mt-1 block w-fit whitespace-nowrap rounded-full bg-[#EE4D2D] px-2 py-0.5 text-[11px] font-semibold text-white">Được yêu thích</span>}
                      {genreBadges.bottom.has(genre.genre) && <span className="mt-1 block w-fit whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Ít được chuộng</span>}
                    </TableCell>
                    <TableCell className="text-right">{n(genre.stories)}</TableCell>
                    <TableCell className="text-right font-semibold">{genre.avgPerStory.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}</TableCell>
                    <TableCell className="text-right">{n(genre.realViewsAll)}</TableCell>
                    <TableCell className="text-right">{n(genre.thisMonth)}</TableCell>
                    <TableCell className="text-right">{n(genre.lastMonth)}</TableCell>
                    <TableCell className="text-right"><Change value={genre.monthChange} /></TableCell>
                    <TableCell className="text-right">{genre.impressions >= min ? pct(genre.clickRate) : <span className="text-muted-foreground" title={`Cần ít nhất ${min} lần popup hiển thị`}>chưa đủ dữ liệu</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      <Card
        title="Tỷ lệ click affiliate theo truyện"
        subtitle={`Tỷ lệ = click / lần popup hiển thị, kỳ: ${periodLabel}. Chỉ xếp hạng truyện có từ ${min} lần hiển thị trở lên để tránh tỷ lệ ảo (ví dụ 1/1 = 100%).`}
      >
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          {([["rate", "Xếp theo tỷ lệ click"], ["clicks", "Xếp theo số click"], ["impressions", "Xếp theo lượt hiển thị"]] as const).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setStorySort(key)} className={`rounded-md border px-3 py-1 ${storySort === key ? "border-[#2D74A8] bg-[#2D74A8] text-white" : "hover:bg-muted"}`}>{label}</button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Truyện</TableHead>
                <TableHead>Thể loại</TableHead>
                <TableHead className="text-right">Lượt nghe trong kỳ</TableHead>
                <TableHead className="text-right">Popup hiển thị</TableHead>
                <TableHead className="text-right">Click</TableHead>
                <TableHead className="w-[220px]">Tỷ lệ click</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...storyRows.ranked, ...storyRows.rest].map((row, index) => {
                const enough = row.impressions >= min
                return (
                  <TableRow key={row.id} className={enough ? "" : "opacity-60"}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="max-w-[240px] truncate font-medium">{row.title}</TableCell>
                    <TableCell className="max-w-[160px] truncate text-muted-foreground">{row.genre || "Khác"}</TableCell>
                    <TableCell className="text-right">{n(row.listens)}</TableCell>
                    <TableCell className="text-right">{n(row.impressions)}</TableCell>
                    <TableCell className="text-right font-semibold text-[#EE4D2D]">{n(row.clicks)}</TableCell>
                    <TableCell>
                      {enough ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[#EE4D2D]" style={{ width: `${Math.min(100, row.clickRate ?? 0)}%` }} /></div>
                          <span className="w-14 text-right text-sm font-semibold">{pct(row.clickRate)}</span>
                        </div>
                      ) : <span className="text-sm text-muted-foreground">chưa đủ dữ liệu</span>}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </section>
  )
}
