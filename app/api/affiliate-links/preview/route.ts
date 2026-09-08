import { NextResponse } from "next/server"

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
}

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url")
  if (!url) return NextResponse.json({ error: "Thiếu URL Shopee" }, { status: 400 })

  try {
    const parsed = new URL(url)
    if (!/(^|\.)shopee\./i.test(parsed.hostname)) {
      return NextResponse.json({ error: "Chỉ hỗ trợ URL Shopee" }, { status: 400 })
    }

    const response = await fetch(parsed.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131 Safari/537.36" },
      redirect: "follow",
      cache: "no-store",
    })
    if (!response.ok) throw new Error(`Shopee trả về HTTP ${response.status}`)

    const html = await response.text()
    const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
      || html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)
      || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']image_src["']/i)

    const imageUrl = match?.[1] ? decodeHtml(match[1]) : null

    if (!imageUrl) return NextResponse.json({ image_url: null, message: "Không tìm thấy ảnh og:image từ URL này" })
    return NextResponse.json({ image_url: imageUrl })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không lấy được ảnh Shopee" }, { status: 422 })
  }
}
