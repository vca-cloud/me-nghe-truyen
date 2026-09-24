import { OG_SIZE, renderOgCard } from "@/lib/og-card"

export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "mê nghe truyện - nghe truyện audio miễn phí"

export default function Image() {
  return renderOgCard({ title: "Nghe truyện audio miễn phí", subtitle: "Chọn truyện, bấm nghe, không thu phí" })
}
