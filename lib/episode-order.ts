export type AudioFile = { name: string; url: string }
export type OrderedEpisode = { episode_number: number; title: string; audio_url: string }

// Số đầu tiên trong tên file (bỏ đuôi), ví dụ "01.mp3" → 1, "Tap 12 - abc.mp3" → 12.
export function episodeNumberOf(name: string) {
  const match = name.replace(/\.[^.]+$/, "").match(/\d+/)
  return match ? Number(match[0]) : null
}

// Sắp các file theo số thứ tự trong tên (so sánh số, không so sánh chữ: 2 < 10).
// Nếu mọi file đều có số và không trùng thì dùng chính số đó làm số tập, ngược lại đánh 1..n theo thứ tự đã sắp.
export function orderEpisodes(files: AudioFile[]): OrderedEpisode[] {
  const sorted = [...files].sort((a, b) => {
    const na = episodeNumberOf(a.name)
    const nb = episodeNumberOf(b.name)
    if (na != null && nb != null && na !== nb) return na - nb
    if (na != null && nb == null) return -1
    if (na == null && nb != null) return 1
    return a.name.localeCompare(b.name, "vi", { numeric: true })
  })
  const numbers = sorted.map((file) => episodeNumberOf(file.name))
  const useOwn = numbers.every((n) => n != null && n > 0) && new Set(numbers).size === numbers.length
  return sorted.map((file, index) => {
    const episode_number = useOwn ? (numbers[index] as number) : index + 1
    return { episode_number, title: `Tập ${episode_number}`, audio_url: file.url }
  })
}
