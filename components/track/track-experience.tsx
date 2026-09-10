"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AudioPlayer, type AudioPlayerHandle } from "@/components/track/player"
import { EpisodeList } from "@/components/track/episode-list"
import { AffiliateModal } from "@/components/AffiliateModal"
import type { Episode } from "@/lib/supabase"

interface TrackExperienceProps {
  storyId: number
  title: string
  audioUrl: string | null
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
  audioUrl,
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
    audio_url: audioUrl || "",
    duration: null,
  }), [audioUrl])

  const availableEpisodes = episodes.length > 0 ? episodes : [fallbackEpisode]
  const [selectedNumber, setSelectedNumber] = useState(availableEpisodes[0]?.episode_number || 1)
  const [showAffiliate, setShowAffiliate] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [pendingEpisode, setPendingEpisode] = useState<Episode | null>(null)
  const audioPlayerRef = useRef<AudioPlayerHandle | null>(null)

  const selectedIndex = Math.max(0, availableEpisodes.findIndex((episode) => episode.episode_number === selectedNumber))
  const selectedEpisode = availableEpisodes[selectedIndex] || fallbackEpisode

  const selectEpisode = (episode: Episode) => {
    if (isUnlocked) {
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

  const handleUnlock = () => {
    setIsUnlocked(true)
    setShowAffiliate(false)

    if (pendingEpisode) {
      setSelectedNumber(pendingEpisode.episode_number)
      setPendingEpisode(null)

      // Auto play sau khi chuyển episode
      setTimeout(() => {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.playAudio()
        }
      }, 100)
    } else {
      // Auto play episode hiện tại
      if (audioPlayerRef.current) {
        audioPlayerRef.current.playAudio()
      }
    }
  }

  const handleModalClose = () => {
    setShowAffiliate(false)
    setPendingEpisode(null)
  }

  useEffect(() => {
    if (isUnlocked) return

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
  }, [isUnlocked, selectedEpisode])

  return (
    <>
      <AudioPlayer
        ref={audioPlayerRef}
        title={title}
        storyId={storyId}
        audioUrl={selectedEpisode.audio_url}
        coverUrl={coverUrl}
        episodeTitle={`Tập ${selectedEpisode.episode_number}: ${selectedEpisode.title}`}
        previousTrackId={selectedIndex === 0 ? previousTrackId : undefined}
        nextTrackId={selectedIndex === availableEpisodes.length - 1 ? nextTrackId : undefined}
        onEnded={handleEnded}
        isUnlocked={isUnlocked}
        onShowAffiliate={() => setShowAffiliate(true)}
      />
      <EpisodeList
        episodes={availableEpisodes}
        status={status}
        selectedEpisode={selectedEpisode.episode_number}
        onSelect={selectEpisode}
      />
      <AffiliateModal
        storyId={storyId}
        isOpen={showAffiliate}
        onClose={handleModalClose}
        onUnlock={handleUnlock}
      />
    </>
  )
}