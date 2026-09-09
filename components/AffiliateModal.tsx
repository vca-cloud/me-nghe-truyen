"use client"

import { useEffect, useState } from "react"

interface AffiliateModalProps {
  isOpen: boolean
  onClose: () => void
  onUnlock: () => void
  storyId?: number
}

interface ActiveAffiliateLink {
  id: number
  title: string
  shoppe_url: string
  image_url: string | null
}

export function AffiliateModal({ isOpen, onClose, onUnlock, storyId }: AffiliateModalProps) {
  const [link, setLink] = useState<ActiveAffiliateLink | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

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
  }, [isOpen])

  const finishUnlock = () => {
    onUnlock()
    onClose()
    window.dispatchEvent(new CustomEvent("views-updated"))
  }

  const handleUnlockClick = async () => {
    if (!link?.shoppe_url) return
    window.open(link.shoppe_url, "_blank", "noopener,noreferrer")
    setSubmitting(true)
    try {
      await fetch(`/api/affiliate-links/${link.id}/click`, { method: "POST" })
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

  if (!isOpen) return null

  return (
    <div data-affiliate-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="relative p-6 pb-4">
          <h2 className="text-center text-2xl font-bold text-gray-900">Mời bạn mở khóa audio</h2>
        </div>

        <div className="px-6 pb-6 text-center">
          {loading ? (
            <p className="text-gray-500">Đang tải link Shopee...</p>
          ) : error || !link ? (
            <p className="text-gray-500">{error || "Chưa có link affiliate đang bật."}</p>
          ) : (
            <>
              <p className="mb-6 text-lg text-gray-700">
                Click vào liên kết bên dưới và Mở Ứng Dụng Shopee để mở khóa audio!
              </p>
              <div className="mb-6 rounded-xl bg-gray-50 p-4">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-[200px] w-[200px] items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
                    {link.image_url ? (
                      <img
                        src={link.image_url}
                        alt={link.title}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none"
                          event.currentTarget.nextElementSibling?.classList.remove("hidden")
                        }}
                      />
                    ) : null}
                    <span className={`${link.image_url ? "hidden " : ""}text-3xl`}>🎵</span>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{link.title}</div>
                    <div className="text-sm font-medium text-green-600">Mở khóa ngay</div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => void handleUnlockClick()}
                disabled={submitting}
                className="w-full rounded-xl bg-orange-500 py-4 text-lg font-bold text-white shadow-lg transition-colors hover:bg-orange-600 disabled:opacity-70"
              >
                MỞ KHÓA & NGHE NGAY
              </button>
              <p className="mt-4 text-xs text-gray-500">Link sẽ mở trong tab mới</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
