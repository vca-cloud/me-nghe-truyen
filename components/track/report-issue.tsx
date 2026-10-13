"use client"

import { useState } from "react"
import { CheckCircle2, Flag, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ISSUE_KINDS, USER_ISSUE_KINDS, describeMediaError, type IssueKind } from "@/lib/issue-reports"

type ReportContext = { storyId?: number; episodeId?: number | null; episodeTitle?: string }

export function sendIssueReport(payload: ReportContext & { kind: IssueKind; message?: string; contact?: string; detail?: string; website?: string }) {
  return fetch("/api/report-issue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, pageUrl: window.location.pathname }),
    keepalive: true,
  })
}

// Player gọi khi thẻ <audio> báo lỗi: tự ghi nhận cho admin, người nghe không phải làm gì.
export function reportAudioError(context: ReportContext, code: number | undefined, audioUrl: string) {
  let host = ""
  try { host = new URL(audioUrl).host } catch { /* link không hợp lệ */ }
  const network = typeof navigator !== "undefined" && navigator.onLine === false ? " | thiết bị đang offline" : ""
  void sendIssueReport({ ...context, kind: "audio_error", detail: `${describeMediaError(code)} | host ${host || "?"}${network}` }).catch(() => undefined)
}

// Nút + hộp thoại "Báo lỗi". data-report-issue để lớp chặn click (mở popup affiliate) bỏ qua vùng này.
export function ReportIssueButton({ context, defaultKind = "cannot_play", variant = "link" }: { context: ReportContext; defaultKind?: IssueKind; variant?: "link" | "outline" }) {
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<IssueKind>(defaultKind)
  const [message, setMessage] = useState("")
  const [contact, setContact] = useState("")
  const [website, setWebsite] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const openDialog = () => {
    setKind(defaultKind)
    setSent(false)
    setOpen(true)
  }

  const submit = async () => {
    if (kind === "other" && !message.trim()) {
      toast.error("Vui lòng mô tả lỗi bạn gặp.")
      return
    }
    setSending(true)
    try {
      const response = await sendIssueReport({ ...context, kind, message, contact, website, detail: context.episodeTitle })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Chưa gửi được báo lỗi.")
      setSent(true)
      setMessage("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chưa gửi được báo lỗi.")
    } finally {
      setSending(false)
    }
  }

  return (
    <span data-report-issue>
      {variant === "link" ? (
        <button type="button" onClick={openDialog} className="inline-flex items-center gap-1.5 text-sm text-[#2D74A8] underline-offset-4 hover:text-[#154B95] hover:underline">
          <Flag className="h-3.5 w-3.5" />Gặp sự cố? Báo lỗi
        </button>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={openDialog}><Flag className="mr-1.5 h-4 w-4" />Báo lỗi</Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-report-issue className="bg-background text-foreground sm:max-w-[440px]">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-[#2D74A8] dark:text-[#9ECDDD]" />
              <DialogTitle>Đã nhận báo lỗi, cảm ơn bạn!</DialogTitle>
              <DialogDescription>Chúng mình sẽ kiểm tra và sửa sớm nhất có thể.</DialogDescription>
              <Button type="button" className="mt-2" onClick={() => setOpen(false)}>Đóng</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Báo lỗi</DialogTitle>
                <DialogDescription>{context.episodeTitle ? `Đang nghe: ${context.episodeTitle}. ` : ""}Chọn lỗi bạn gặp, chúng mình sẽ xử lý ngay.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2" role="radiogroup" aria-label="Loại lỗi">
                {USER_ISSUE_KINDS.map((value) => (
                  <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${kind === value ? "border-[#2D74A8] bg-[#9ECDDD]/25 font-medium dark:border-[#9ECDDD]" : "hover:bg-muted"}`}>
                    <input type="radio" name="issue-kind" value={value} checked={kind === value} onChange={() => setKind(value)} className="accent-[#EE4D2D]" />
                    {ISSUE_KINDS[value]}
                  </label>
                ))}
              </div>
              <Textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} rows={3} placeholder={kind === "other" ? "Mô tả lỗi bạn gặp (bắt buộc)" : "Mô tả thêm, ví dụ: phút thứ mấy bị lỗi (không bắt buộc)"} />
              <Input value={contact} onChange={(event) => setContact(event.target.value)} maxLength={200} placeholder="Email/Zalo để báo lại khi đã sửa (không bắt buộc)" />
              <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} className="hidden" aria-hidden="true" />
              <Button type="button" disabled={sending} onClick={() => void submit()} className="w-full bg-[#EE4D2D] text-white hover:bg-[#EE4D2D]/90">
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flag className="mr-2 h-4 w-4" />}Gửi báo lỗi
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </span>
  )
}
