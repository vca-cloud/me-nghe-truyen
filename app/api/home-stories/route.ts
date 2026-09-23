import { NextResponse } from "next/server"
import { getHomeStories } from "@/lib/home-stories"

export const revalidate = 60

export async function GET() {
  try {
    return NextResponse.json({ stories: await getHomeStories() })
  } catch (error) {
    console.error("Home-stories error:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không tải được dữ liệu" },
      { status: 500 }
    )
  }
}
