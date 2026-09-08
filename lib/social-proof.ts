export const ACTIVE_LISTENER_MIN = 15
export const ACTIVE_LISTENER_MAX = 85

export function randomActiveListeners() {
  return Math.floor(Math.random() * (ACTIVE_LISTENER_MAX - ACTIVE_LISTENER_MIN + 1)) + ACTIVE_LISTENER_MIN
}

export function updateActiveListeners(current: number) {
  const change = Math.floor(Math.random() * 3) + 1
  const direction = Math.random() < 0.5 ? -1 : 1
  return Math.max(ACTIVE_LISTENER_MIN, Math.min(ACTIVE_LISTENER_MAX, current + direction * change))
}

export function randomSocialProofDelay() {
  return (Math.floor(Math.random() * 6) + 5) * 1000
}

export function activeListenersForStory(storyId: number) {
  return ACTIVE_LISTENER_MIN + ((Math.abs(storyId) * 7919) % (ACTIVE_LISTENER_MAX - ACTIVE_LISTENER_MIN + 1))
}

export function totalActiveListeners(storyIds: number[]) {
  return storyIds.reduce((total, storyId) => total + activeListenersForStory(storyId), 0)
}
