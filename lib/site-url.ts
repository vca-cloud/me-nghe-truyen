const DEFAULT_SITE_URL = "https://menghetruyen.com"

export function getSiteUrl(fallbackOrigin?: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const origin = configured || fallbackOrigin || DEFAULT_SITE_URL
  return origin.replace(/\/$/, "")
}

export function getSafeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/"
  return value
}
