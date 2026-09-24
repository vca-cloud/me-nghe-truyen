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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
}

export default nextConfig
