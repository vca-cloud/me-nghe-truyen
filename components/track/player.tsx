"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Headphones, Moon, Pause, Play, RotateCcw, RotateCw, SkipBack, SkipForward } from "lucide-react"
import { ImageWithFallback } from "@/components/image-with-fallback"
import { trackEvent } from "@/lib/analytics"
import { readLocalProgress, writeLocalProgress } from "@/lib/local-progress"

interface HistoryRow {
  episode_id: number | null
  progress_seconds: number
  duration_seconds: number
  completed: boolean
}

export interface AudioPlayerHandle {
  playAudio: () => Promise<void>
}

interface AudioPlayerProps {
  title: string
  audioUrl: string
  coverUrl?: string | null
  episodeTitle?: string
  previousTrackId?: string
  nextTrackId?: string
  onEnded?: () => void
  onPlayStarted?: () => void
  isUnlocked?: boolean
  onShowAffiliate?: () => void
  storyId?: number
  episodeId?: number | null
}

type SleepMode = null | 15 | 30 | 60 | "episode"
const SLEEP_OPTIONS: { value: Exclude<SleepMode, null>; label: string }[] = [
  { value: 15, label: "15 phút" },
  { value: 30, label: "30 phút" },
  { value: 60, label: "60 phút" },
  { value: "episode", label: "Hết tập" },
]

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(function AudioPlayer(
  {
    title,
    audioUrl,
    coverUrl,
    episodeTitle = "Tập 1",
    previousTrackId,
    nextTrackId,
    onEnded,
    onPlayStarted,
    isUnlocked = false,
    onShowAffiliate,
    storyId,
    episodeId = null,
  },
  ref
) {
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement>(null)
  const startedRef = useRef(false)
  const lastSavedRef = useRef(0)
  const restoredRef = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [sleepMode, setSleepMode] = useState<SleepMode>(null)
  const [sleepEndsAt, setSleepEndsAt] = useState<number | null>(null)
  const [sleepRemaining, setSleepRemaining] = useState(0)

  const saveProgress = async (completed = false, force = false) => {
    if (!storyId || !audioRef.current || !Number.isFinite(duration)) return
    const progress = audioRef.current.currentTime
    if (!force && !completed && Math.abs(progress - lastSavedRef.current) < 5) return
    lastSavedRef.current = progress
    writeLocalProgress(storyId, episodeId, { progress, duration, completed })
    await fetch("/api/listening-history", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId, episodeId, progressSeconds: progress, durationSeconds: duration, completed }),
      keepalive: true,
    }).catch(() => undefined)
  }

  const playAudio = async () => {
    const audio = audioRef.current
    if (!audio) return
    try {
      if (audio.ended || (audio.duration && audio.currentTime >= audio.duration - 0.3)) {
        audio.currentTime = 0
        startedRef.current = false
      }
      await audio.play()
    } catch {
      setError("Không thể phát file audio. Hãy kiểm tra URL R2 công khai.")
    }
  }

  useImperativeHandle(ref, () => ({ playAudio }), [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.load()
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setError(null)
    startedRef.current = false
    restoredRef.current = false
    lastSavedRef.current = 0

    const restore = (seconds: number) => {
      audio.currentTime = seconds
      setCurrentTime(seconds)
    }
    const loadProgress = async () => {
      const response = await fetch(`/api/listening-history?storyId=${storyId}&episodeId=${episodeId || ""}`).catch(() => null)
      const data = response?.ok ? await response.json().catch(() => ({})) as { history?: HistoryRow[] } : {}
      const row = data.history?.[0]
      if (row) {
        if (!row.completed && row.progress_seconds > 0) restore(row.progress_seconds)
      } else if (storyId) {
        const local = readLocalProgress(storyId, episodeId)
        if (local && !local.completed && local.progress > 0) restore(local.progress)
      }
      restoredRef.current = true
    }
    void loadProgress()
  }, [audioUrl, episodeId, storyId])

  const togglePlay = () => {
    if (!isUnlocked) {
      onShowAffiliate?.()
      return
    }
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) void playAudio()
    else audio.pause()
  }

  const seek = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.min(Math.max(seconds, 0), duration || 0)
    setCurrentTime(audio.currentTime)
  }

  const navigate = (slug?: string) => {
    if (slug) router.push(`/track/${slug}`)
  }

  const handlePrevious = () => {
    if (currentTime > 3 || !previousTrackId) seek(0)
    else navigate(previousTrackId)
  }

  const chooseSleep = (mode: SleepMode) => {
    setSleepMode(mode)
    setSleepEndsAt(typeof mode === "number" ? Date.now() + mode * 60_000 : null)
    if (mode) trackEvent("sleep_timer_set", { mode: String(mode) })
  }

  useEffect(() => {
    if (!sleepEndsAt) return
    const tick = () => {
      const left = sleepEndsAt - Date.now()
      if (left <= 0) {
        audioRef.current?.pause()
        setSleepMode(null)
        setSleepEndsAt(null)
        setSleepRemaining(0)
        return
      }
      setSleepRemaining(left)
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [sleepEndsAt])

  // Điều khiển trên màn hình khóa / tai nghe / thông báo hệ thống (Media Session API).
  const actionsRef = useRef({ togglePlay, seek, handlePrevious, next: () => navigate(nextTrackId), currentTime })
  actionsRef.current = { togglePlay, seek, handlePrevious, next: () => navigate(nextTrackId), currentTime }

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return
    const artwork = coverUrl ? [{ src: coverUrl, sizes: "512x512" }] : []
    navigator.mediaSession.metadata = new MediaMetadata({ title: episodeTitle, artist: title, album: "mê nghe truyện", artwork })
    const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try { navigator.mediaSession.setActionHandler(action, handler) } catch { /* trình duyệt không hỗ trợ action này */ }
    }
    set("play", () => { if (audioRef.current?.paused) actionsRef.current.togglePlay() })
    set("pause", () => audioRef.current?.pause())
    set("seekbackward", (details) => actionsRef.current.seek(actionsRef.current.currentTime - (details.seekOffset || 10)))
    set("seekforward", (details) => actionsRef.current.seek(actionsRef.current.currentTime + (details.seekOffset || 10)))
    set("seekto", (details) => { if (details.seekTime != null) actionsRef.current.seek(details.seekTime) })
    set("previoustrack", () => actionsRef.current.handlePrevious())
    set("nexttrack", nextTrackId ? () => actionsRef.current.next() : null)
    return () => {
      for (const action of ["play", "pause", "seekbackward", "seekforward", "seekto", "previoustrack", "nexttrack"] as MediaSessionAction[]) set(action, null)
    }
  }, [title, episodeTitle, coverUrl, nextTrackId])

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused"
  }, [isPlaying])

  return (
    <div className="flex w-full flex-col gap-6">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime)
          const media = e.currentTarget
          if ("mediaSession" in navigator && Number.isFinite(media.duration) && media.duration > 0) {
            try { navigator.mediaSession.setPositionState({ duration: media.duration, position: Math.min(media.currentTime, media.duration), playbackRate: media.playbackRate }) } catch { /* bỏ qua */ }
          }
          if (restoredRef.current && e.currentTarget.currentTime - lastSavedRef.current >= 10) void saveProgress()
        }}
        onPlay={() => {
          setIsPlaying(true)
          if (!startedRef.current) {
            startedRef.current = true
            trackEvent("audio_play", { story_id: storyId, episode_id: episodeId, story_title: title, episode_title: episodeTitle })
            onPlayStarted?.()
            void saveProgress(false, true)
          }
        }}
        onPause={() => {
          setIsPlaying(false)
          void saveProgress()
        }}
        onEnded={() => {
          setIsPlaying(false)
          void saveProgress(true)
          startedRef.current = false
          trackEvent("audio_complete", { story_id: storyId, episode_id: episodeId, story_title: title, episode_title: episodeTitle })
          if (sleepMode === "episode") {
            setSleepMode(null)
            return
          }
          onEnded?.()
          if (!onEnded) navigate(nextTrackId)
        }}
        onError={() => setError("Không tải được file audio từ URL đã cung cấp.")}
      />

      <div className="flex w-full flex-col items-center gap-8">
        <div className="h-56 w-56 overflow-hidden rounded-xl border shadow-xl">
          {coverUrl ? (
            <ImageWithFallback src={coverUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground" role="img" aria-label={title}>
              <Headphones className="h-1/3 w-1/3" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="text-base text-muted-foreground">{episodeTitle}</div>
          <div className="mt-1 text-3xl font-bold text-foreground">{title}</div>
        </div>

        <div className="w-full">
          <Slider
            value={[currentTime]}
            max={Math.max(duration, 1)}
            step={0.1}
            onValueChange={(v) => seek(Number(Array.isArray(v) ? v[0] ?? 0 : v))}
            aria-label="Tiến trình phát"
            className="[&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-thumb]]:size-5"
          />
          <div className="mt-2 flex justify-between text-base text-[#154B95]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {error && <p className="text-center text-sm text-destructive">{error}</p>}

        <div className="flex w-full items-center justify-center gap-3 sm:gap-5 md:gap-6">
          <Button variant="ghost" size="icon" aria-label="Bài trước" disabled={!previousTrackId && currentTime <= 3} onClick={handlePrevious} className="h-12 w-12 shrink-0">
            <SkipBack className="h-7 w-7" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Lùi 10 giây" onClick={() => seek(currentTime - 10)} className="h-12 w-12 shrink-0">
            <RotateCcw className="h-7 w-7" />
          </Button>
          <Button size="icon" aria-label={isPlaying ? "Tạm dừng" : "Phát"} onClick={togglePlay} className="h-24 w-24 shrink-0 rounded-xl bg-primary text-primary-foreground">
            {isPlaying ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Tiến 10 giây" onClick={() => seek(currentTime + 10)} className="h-12 w-12 shrink-0">
            <RotateCw className="h-7 w-7" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Bài tiếp theo" disabled={!nextTrackId} onClick={() => navigate(nextTrackId)} className="h-12 w-12 shrink-0">
            <SkipForward className="h-7 w-7" />
          </Button>
        </div>

        <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:gap-3">
          {[0.75, 1, 1.5, 2].map((rate) => (
            <Button
              key={rate}
              variant={playbackRate === rate ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setPlaybackRate(rate)
                if (audioRef.current) audioRef.current.playbackRate = rate
              }}
            >
              {rate}x
            </Button>
          ))}
        </div>

        <div className="flex w-full flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-[#154B95] dark:text-[#9ECDDD]">
            <Moon className="h-4 w-4" />
            {sleepMode === "episode"
              ? "Sẽ dừng khi hết tập này"
              : sleepMode
                ? `Tự tắt sau ${formatTime(sleepRemaining / 1000)}`
                : "Hẹn giờ tắt"}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {SLEEP_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={sleepMode === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => chooseSleep(sleepMode === option.value ? null : option.value)}
              >
                {option.label}
              </Button>
            ))}
            {sleepMode && <Button variant="ghost" size="sm" onClick={() => chooseSleep(null)}>Hủy</Button>}
          </div>
        </div>
      </div>
    </div>
  )
})
