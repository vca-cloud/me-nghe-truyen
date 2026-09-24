type GtagWindow = Window & { gtag?: (command: "event", name: string, params?: Record<string, unknown>) => void }

export function trackEvent(name: string, params: Record<string, string | number | boolean | null | undefined> = {}) {
  if (typeof window === "undefined") return
  const gtag = (window as GtagWindow).gtag
  if (typeof gtag === "function") gtag("event", name, params)
}
