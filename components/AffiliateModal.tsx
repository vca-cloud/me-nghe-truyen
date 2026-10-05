"use client"

import { useEffect, useRef, useState } from "react"
import { Headphones } from "lucide-react"
import { trackEvent } from "@/lib/analytics"
import { BrandName } from "@/components/info-page"

interface AffiliateModalProps {
  isOpen: boolean
  onClose: () => void
  onUnlock: () => void
  storyId?: number
  storyTitle?: string
  episodeLabel?: string
  coverUrl?: string | null
}

interface ActiveAffiliateLink {
  id: number
  title: string
  shoppe_url: string
  image_url: string | null
}

export function AffiliateModal({ isOpen, onClose, onUnlock, storyId, storyTitle, episodeLabel, coverUrl }: AffiliateModalProps) {
  const [link, setLink] = useState<ActiveAffiliateLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prefetch link ngay khi component mount (không đợi isOpen)
  useEffect(() => {
    const fetchActiveLink = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/affiliate-links/active")
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Không tải được link affiliate")
        setLink(data.link || null)
        if (!data.link) setError("Chưa có link affiliate đang bật. Hãy thêm link trong trang quản trị.")
      } catch (fetchError) {
        setLink(null)
        setError(fetchError instanceof Error ? fetchError.message : "Không tải được link affiliate")
      } finally {
        setLoading(false)
      }
    }

    void fetchActiveLink()
  }, [])

  const impressionSentRef = useRef(false)
  useEffect(() => {
    if (!isOpen) {
      impressionSentRef.current = false
      return
    }
    if (!link || impressionSentRef.current) return
    impressionSentRef.current = true
    trackEvent("affiliate_impression", { link_id: link.id, story_id: storyId })
    void fetch("/api/affiliate-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "impression", linkId: link.id, storyId }),
      keepalive: true,
    }).catch(() => undefined)
  }, [isOpen, link, storyId])

  const finishUnlock = () => {
    onUnlock()
    onClose()
    window.dispatchEvent(new CustomEvent("views-updated"))
  }

  const handleUnlockClick = async () => {
    if (!link?.shoppe_url) return
    window.open(link.shoppe_url, "_blank", "noopener,noreferrer")
    trackEvent("affiliate_click", { link_id: link.id, story_id: storyId })
    setSubmitting(true)
    try {
      await fetch(`/api/affiliate-links/${link.id}/click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId }),
      })
      if (storyId !== undefined) {
        await fetch("/api/increment-views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storyId }),
        })
      }
    } catch (unlockError) {
      console.warn(unlockError)
    } finally {
      finishUnlock()
      setSubmitting(false)
    }
  }

  // Không hiển thị popup tải trước; chỉ render popup Shopee khi link đã sẵn sàng.
  if (!isOpen || loading || !link) return null

  return (
    <div data-affiliate-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="affiliate-title" className="w-full max-w-md overflow-hidden rounded-2xl border border-[#9ECDDD] bg-background text-foreground shadow-2xl dark:border-[#2D74A8]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[#9ECDDD] bg-[#F7FCFC] px-5 py-4 dark:border-[#2D74A8] dark:bg-white/5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#154B95] text-white dark:bg-[#2D74A8]">
            {coverUrl ? <img src={coverUrl} alt="" className="h-full w-full object-cover" /> : <Headphones className="h-6 w-6" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-foreground">{storyTitle || "Truyện audio"}</p>
            {episodeLabel && <p className="text-sm text-muted-foreground">{episodeLabel}</p>}
          </div>
        </div>

        <div className="px-6 pb-6 pt-5 text-center">
          {error ? <p className="text-muted-foreground">{error}</p> : (
            <>
              <h2 id="affiliate-title" className="text-2xl font-bold text-foreground">Nghe miễn phí, chỉ cần 1 chạm</h2>
              <p className="mt-2 text-[15px] leading-6 text-muted-foreground">
                <BrandName /> duy trì nhờ link Shopee. Bạn chỉ cần bấm mở link, <strong className="text-foreground">không cần mua gì</strong>, rồi quay lại là nghe ngay.
              </p>
              <ul className="mx-auto mt-4 w-fit space-y-1.5 text-left text-[15px] text-foreground">
                <li><span className="mr-2 font-bold text-[#EE4D2D]">✓</span>Miễn phí toàn bộ truyện</li>
                <li><span className="mr-2 font-bold text-[#EE4D2D]">✓</span>Nghe trọn các tập của truyện này</li>
                <li><span className="mr-2 font-bold text-[#EE4D2D]">✓</span>Không cần đăng ký tài khoản</li>
              </ul>
              <button
                onClick={() => void handleUnlockClick()}
                disabled={submitting}
                className="mt-5 w-full rounded-xl bg-[#EE4D2D] py-4 text-lg font-bold text-white shadow-lg transition-colors hover:bg-[#d8401f] disabled:opacity-70"
              >
                ▶ NGHE NGAY – MIỄN PHÍ
              </button>
              <p className="mt-2 text-xs text-muted-foreground">Shopee mở ở tab mới · Quay lại tab này để nghe</p>

              <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#9ECDDD] bg-[#F7FCFC] p-3 text-left dark:border-[#2D74A8] dark:bg-white/5">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
                  {link.image_url ? <img src={link.image_url} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-xl">🛍️</span>}
                </div>
                <div className="min-w-0 text-sm">
                  <p className="text-muted-foreground">Gợi ý hôm nay</p>
                  <p className="truncate font-medium text-foreground">{link.title}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
