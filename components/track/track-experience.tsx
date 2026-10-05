"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AudioPlayer, type AudioPlayerHandle } from "@/components/track/player"
import { EpisodeList } from "@/components/track/episode-list"
import { AffiliateModal } from "@/components/AffiliateModal"
import { toast } from "sonner"
import type { PublicEpisode as Episode } from "@/lib/supabase"

interface TrackExperienceProps {
  storyId: number
  title: string
  coverUrl: string | null
  episodeCount: number
  status: string | null
  episodes: Episode[]
  previousTrackId?: string
  nextTrackId?: string
}

export function TrackExperience({
  storyId,
  title,
  coverUrl,
  episodeCount,
  status,
  episodes,
  previousTrackId,
  nextTrackId,
}: TrackExperienceProps) {
  const fallbackEpisode = useMemo<Episode>(() => ({
    id: 0,
    story_id: 0,
    episode_number: 1,
    title: "Tập 1",
    duration: null,
  }), [])
  const [audioUrls, setAudioUrls] = useState<{ fallback: string | null; byId: Record<number, string> } | null>(null)

  const availableEpisodes = episodes.length > 0 ? episodes : [fallbackEpisode]
  const [selectedNumber, setSelectedNumber] = useState(availableEpisodes[0]?.episode_number || 1)
  const [showAffiliate, setShowAffiliate] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  // Không ghi nhớ giữa các lần vào trang: mỗi lần mở trang được nghe thử 60s rồi phải bấm link.
  const [previewUsed, setPreviewUsed] = useState(false)
  const [pendingEpisode, setPendingEpisode] = useState<Episode | null>(null)
  const audioPlayerRef = useRef<AudioPlayerHandle | null>(null)

  const selectedIndex = Math.max(0, availableEpisodes.findIndex((episode) => episode.episode_number === selectedNumber))
  const selectedEpisode = availableEpisodes[selectedIndex] || fallbackEpisode

  const selectEpisode = (episode: Episode) => {
    if (isUnlocked || !previewUsed) {
      setSelectedNumber(episode.episode_number)
    } else {
      setPendingEpisode(episode)
      setShowAffiliate(true)
    }
  }

  const handleEnded = () => {
    // Không reset unlock — giữ unlock cho session
    setPendingEpisode(null)
    setShowAffiliate(false)
  }

  const fetchAudioUrls = async (preview = false) => {
    const response = await fetch(`/api/track-audio?storyId=${storyId}${preview ? "&preview=1" : ""}`, { cache: "no-store" })
    if (!response.ok) throw new Error("locked")
    const data = await response.json() as { fallbackAudioUrl: string | null; episodes: { id: number; audio_url: string }[] }
    const urls = { fallback: data.fallbackAudioUrl, byId: Object.fromEntries(data.episodes.map((episode) => [episode.id, episode.audio_url])) }
    setAudioUrls(urls)
    return urls
  }

  const handleUnlock = async () => {
    setShowAffiliate(false)
    try {
      if (!audioUrls) await fetchAudioUrls()
    } catch {
      toast.error("Chưa mở khóa được audio. Vui lòng bấm lại nút mở khóa.")
      return
    }
    setIsUnlocked(true)
    if (pendingEpisode) {
      setSelectedNumber(pendingEpisode.episode_number)
      setPendingEpisode(null)
    }
    // Chờ player nhận link mới rồi mới phát.
    setTimeout(() => { void audioPlayerRef.current?.playAudio() }, 120)
  }

  const loadPreviewAudio = async () => {
    try {
      await fetchAudioUrls(true)
      return true
    } catch {
      toast.error("Không tải được audio, vui lòng thử lại.")
      return false
    }
  }

  const handlePreviewEnd = () => {
    setPreviewUsed(true)
    setPendingEpisode(null)
    setShowAffiliate(true)
  }

  const handleModalClose = () => {
    setShowAffiliate(false)
    setPendingEpisode(null)
  }

  useEffect(() => {
    if (isUnlocked || !previewUsed) return

    const openAffiliateForInteraction = (event: Event) => {
      const target = event.target
      if (target instanceof Element && target.closest("[data-affiliate-modal]")) return
      event.preventDefault()
      event.stopPropagation()
      setPendingEpisode(selectedEpisode)
      setShowAffiliate(true)
    }

    document.addEventListener("click", openAffiliateForInteraction, true)
    document.addEventListener("touchend", openAffiliateForInteraction, true)
    return () => {
      document.removeEventListener("click", openAffiliateForInteraction, true)
      document.removeEventListener("touchend", openAffiliateForInteraction, true)
    }
  }, [isUnlocked, previewUsed, selectedEpisode])

  return (
    <>
      <AudioPlayer
        ref={audioPlayerRef}
        title={title}
        storyId={storyId}
        episodeId={selectedEpisode.id || null}
        audioUrl={(selectedEpisode.id ? audioUrls?.byId[selectedEpisode.id] : audioUrls?.fallback) || ""}
        coverUrl={coverUrl}
        episodeTitle={`Tập ${selectedEpisode.episode_number}: ${selectedEpisode.title}`}
        previousTrackId={selectedIndex === 0 ? previousTrackId : undefined}
        nextTrackId={selectedIndex === availableEpisodes.length - 1 ? nextTrackId : undefined}
        onEnded={handleEnded}
        isUnlocked={isUnlocked}
        onShowAffiliate={() => setShowAffiliate(true)}
        previewSeconds={60}
        previewUsed={previewUsed}
        onPreviewEnd={handlePreviewEnd}
        onNeedAudio={loadPreviewAudio}
      />
      <EpisodeList
        episodes={availableEpisodes}
        status={status}
        selectedEpisode={selectedEpisode.episode_number}
        onSelect={selectEpisode}
      />
      <AffiliateModal
        storyId={storyId}
        storyTitle={title}
        episodeLabel={`Tập ${selectedEpisode.episode_number}`}
        coverUrl={coverUrl}
        isOpen={showAffiliate}
        onClose={handleModalClose}
        onUnlock={() => void handleUnlock()}
      />
    </>
  )
}