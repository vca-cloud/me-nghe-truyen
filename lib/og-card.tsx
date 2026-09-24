import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const OG_SIZE = { width: 1200, height: 630 }

const fontPromise = readFile(join(process.cwd(), "assets/fonts/BeVietnamPro-Bold.ttf"))

export async function renderOgCard({ title, subtitle, coverUrl }: { title: string; subtitle?: string; coverUrl?: string | null }) {
  const font = await fontPromise
  const titleSize = title.length > 60 ? 56 : title.length > 32 ? 68 : 84
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(135deg, #102D54 0%, #154B95 60%, #2D74A8 100%)", color: "#FFFFFF", fontFamily: "BeVietnamPro", padding: 64 }}>
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" width={440} height={440} style={{ width: 440, height: 440, borderRadius: 32, objectFit: "cover", marginRight: 56, alignSelf: "center" }} />
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 44, letterSpacing: -1 }}>
            <span style={{ color: "#EE4D2D" }}>mê</span>
            <span style={{ marginLeft: 14, color: "#D4EEED" }}>nghe truyện</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: titleSize, lineHeight: 1.15, letterSpacing: -1 }}>{title}</div>
            {subtitle ? <div style={{ display: "flex", marginTop: 24, fontSize: 32, color: "#9ECDDD" }}>{subtitle}</div> : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", fontSize: 30, color: "#D4EEED" }}>
            <div style={{ display: "flex", width: 18, height: 18, borderRadius: 9, background: "#EE4D2D", marginRight: 16 }} />
            Nghe truyện audio miễn phí • menghetruyen.com
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: "BeVietnamPro", data: font, style: "normal", weight: 700 }] },
  )
}
