const DEFAULT_SITE_URL = "https://menghetruyen.com"

export function getSiteUrl(fallbackOrigin?: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) {
    try {
      const configuredUrl = new URL(configured)
      if (configuredUrl.hostname === "menghetruyen.com" || configuredUrl.hostname === "www.menghetruyen.com") {
        return configuredUrl.origin
      }
      if (/^(localhost|127\.0\.0\.1)$/i.test(configuredUrl.hostname)) return configuredUrl.origin
    } catch {
      // Fall through to the safe canonical default for malformed values.
    }
  }

  // Never use a Vercel preview hostname for Auth redirects.
  if (fallbackOrigin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(fallbackOrigin)) {
    return fallbackOrigin.replace(/\/$/, "")
  }
  return DEFAULT_SITE_URL
}

export function getSafeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/"
  return value
}
