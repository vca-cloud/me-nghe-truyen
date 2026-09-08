const EMPTY_DURATION = new Set([
  "",
  "--",
  "-",
  "0",
  "0:00",
  "00:00",
  "0h 0m",
  "0h 00m",
  "0m",
  "0m 0s",
])

export function isEmptyDuration(value: string | number | null | undefined): boolean {
  if (typeof value === "number") return !Number.isFinite(value) || value <= 0
  if (value == null) return true
  return EMPTY_DURATION.has(value.trim().toLowerCase())
}

export function parseDurationSeconds(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
  }

  if (!value?.trim()) return 0
  const input = value.trim().toLowerCase().replace(",", ".")
  if (EMPTY_DURATION.has(input)) return 0

  if (/^\d+(\.\d+)?$/.test(input)) {
    const seconds = Number(input)
    return seconds > 0 ? Math.floor(seconds) : 0
  }

  const clock = input.match(/^(?:(\d+):)?(\d+):(\d{2})$/)
  if (clock) {
    return Number(clock[1] || 0) * 3600 + Number(clock[2]) * 60 + Number(clock[3])
  }

  const ph = input.match(/^(\d+)\s*ph(?:ut|út)?\s*(\d{1,2})?s?$/)
  if (ph) return Number(ph[1]) * 60 + Number(ph[2] || 0)

  const hm = input.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?(?:\s*(\d+)\s*s)?$/)
  if (hm && (hm[1] || hm[2] || hm[3])) {
    return Number(hm[1] || 0) * 3600 + Number(hm[2] || 0) * 60 + Number(hm[3] || 0)
  }

  return 0
}

export function formatEpisodeDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return ""
  const total = Math.floor(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remainingSeconds = total % 60
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export function formatTotalDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--"
  const totalMinutes = Math.floor(seconds / 60)
  if (totalMinutes <= 0) return "--"
  if (totalMinutes < 60) return `${totalMinutes}m`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}m`
}

export function formatTotalDurationAsTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--"
  const total = Math.floor(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remainingSeconds = total % 60
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export function formatDuration(seconds: number): string {
  return formatEpisodeDuration(seconds)
}

export function sumDurationSeconds(values: Array<string | number | null | undefined>): number {
  return values.reduce<number>((total, value) => total + parseDurationSeconds(value), 0)
}

export function sumDurations(values: Array<string | number | null | undefined>): string {
  return formatTotalDuration(sumDurationSeconds(values))
}

export function formatTotalDurationFromEpisodes(
  episodes: Array<{ duration?: string | number | null } | string | number | null | undefined>
): string {
  const values = episodes.map((episode) =>
    episode && typeof episode === "object" ? episode.duration : episode
  )
  return sumDurations(values)
}

export function loadAudioDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    if (!url.trim()) {
      reject(new Error("Thiếu link audio."))
      return
    }
    const audio = new Audio()
    let settled = false
    const finish = (error?: Error, duration?: number) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      audio.onloadedmetadata = null
      audio.ondurationchange = null
      audio.onerror = null
      audio.src = ""
      if (error || !duration) reject(error || new Error("Không đọc được thời lượng."))
      else resolve(duration)
    }
    const tryResolve = () => {
      const duration = audio.duration
      if (Number.isFinite(duration) && duration > 0) finish(undefined, duration)
    }
    const timeoutId = window.setTimeout(() => finish(new Error("Hết thời gian đọc metadata audio.")), 12000)
    audio.preload = "metadata"
    audio.onloadedmetadata = tryResolve
    audio.ondurationchange = tryResolve
    audio.onerror = () => finish(new Error("Không tải được file audio."))
    audio.src = url.trim()
    audio.load()
  })
}
