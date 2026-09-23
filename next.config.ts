import type { NextConfig } from "next"

const r2Url = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "")
  } catch {
    return null
  }
})()

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: r2Url ? [{ protocol: "https", hostname: r2Url.hostname }] : [],
  },
}

export default nextConfig
