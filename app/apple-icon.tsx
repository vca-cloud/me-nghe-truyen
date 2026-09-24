import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#154B95" }}>
        <svg width="120" height="120" viewBox="0 0 24 24">
          <path d="M3 17v-5a9 9 0 0 1 18 0v5" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
          <rect x="2.6" y="13.4" width="5.6" height="7.8" rx="2" fill="#EE4D2D" />
          <rect x="15.8" y="13.4" width="5.6" height="7.8" rx="2" fill="#EE4D2D" />
        </svg>
      </div>
    ),
    size,
  )
}
