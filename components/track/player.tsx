"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Headphones, Pause, Play, RotateCcw, RotateCw, SkipBack, SkipForward } from "lucide-react"
import { ImageWithFallback } from "@/components/image-with-fallback"

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
}

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
  },
  ref
) {
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement>(null)
  const startedRef = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const playAudio = async () => {
    const audio = audioRef.current
    if (!audio) return
    try {
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
  }, [audioUrl])

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

  return (
    <div className="flex w-full flex-col gap-6">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => {
          setIsPlaying(true)
          if (!startedRef.current) {
            startedRef.current = true
            onPlayStarted?.()
          }
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false)
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
      </div>
    </div>
  )
})
