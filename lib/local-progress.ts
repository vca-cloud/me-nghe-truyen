const PREFIX = "mnt-progress"

export type LocalProgress = { progress: number; duration: number; completed: boolean; updatedAt: number }

function key(storyId: number, episodeId: number | null) {
  return `${PREFIX}:${storyId}:${episodeId ?? 0}`
}

export function readLocalProgress(storyId: number, episodeId: number | null): LocalProgress | null {
  try {
    const raw = localStorage.getItem(key(storyId, episodeId))
    if (!raw) return null
    const value = JSON.parse(raw) as LocalProgress
    return Number.isFinite(value.progress) ? value : null
  } catch {
    return null
  }
}

export function writeLocalProgress(storyId: number, episodeId: number | null, value: Omit<LocalProgress, "updatedAt">) {
  try {
    localStorage.setItem(key(storyId, episodeId), JSON.stringify({ ...value, updatedAt: Date.now() }))
  } catch {
    // localStorage có thể bị chặn (chế độ ẩn danh); bỏ qua.
  }
}
