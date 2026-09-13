"use client"

import { useEffect, useMemo, useState } from "react"
import { Bookmark, ListPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"

export function TrackActions({ storyId, nextPath }: { storyId: number; nextPath: string }) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let active = true
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (active) setLoading(false)
        return
      }
      const response = await fetch(`/api/favorites?storyId=${storyId}`)
      if (response.ok) {
        const data = await response.json()
        if (active) setSaved(Boolean(data.saved))
      }
      if (active) setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [storyId, supabase])

  const toggleSaved = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(nextPath)}`)
      return
    }
    setLoading(true)
    const response = await fetch(`/api/favorites${saved ? `?storyId=${storyId}` : ""}`, {
      method: saved ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: saved ? undefined : JSON.stringify({ storyId }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) toast.error(data.error || "Không thể cập nhật audio đã lưu")
    else {
      setSaved(!saved)
      toast.success(saved ? "Đã bỏ lưu audio" : "Đã lưu audio")
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant={saved ? "default" : "outline"} size="icon" aria-label={saved ? "Bỏ lưu audio" : "Lưu audio"} title={saved ? "Bỏ lưu audio" : "Lưu audio"} disabled={loading} onClick={() => void toggleSaved()}>
        <Bookmark className={saved ? "fill-current" : ""} />
      </Button>
      <Button variant="outline" size="icon" aria-label="Danh sách audio" title="Danh sách audio" onClick={() => void toggleSaved()}>
        <ListPlus />
      </Button>
    </div>
  )
}
