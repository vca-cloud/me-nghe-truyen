const DEFAULT_SITE_URL = "https://menghetruyen.com"

export function getSiteUrl(fallbackOrigin?: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) return configured.replace(/\/$/, "")

  // Preview Vercel domains must not become Auth redirect origins. Keep the
  // browser origin only for local development; production defaults to the
  // canonical domain even when the Vercel variable was not configured yet.
  if (fallbackOrigin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(fallbackOrigin)) {
    return fallbackOrigin.replace(/\/$/, "")
  }
  return DEFAULT_SITE_URL
}

export function getSafeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/"
  return value
}
