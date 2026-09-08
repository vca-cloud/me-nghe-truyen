"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Users } from "lucide-react"
import { ImageWithFallback } from "@/components/image-with-fallback"

const stories = [
  ["Hoàng Hậu Không Ngại", "Cổ trang", "Câu chuyện về nàng Minh Nguyệt bị ép vào cung, từng bước vượt qua âm mưu thâm hiểm...", "Nguyễn Minh Tâm", "240 tập", "91.3K", "69", "45:23"],
  ["Người Phán Xử Cuối", "Trinh thám", "Một thám tử đối mặt với vụ án cuối đời và sự thật phơi bày cả một hệ thống...", "Trần Hùng", "180 tập", "67.8K", "", "38:55"],
  ["Ngọn Lửa Tình Yêu", "Hiện đại", "Hai con người từ hai thế giới khác nhau tình cờ gặp nhau trong một đêm mưa...", "Lê Thu Hà", "96 tập", "45.2K", "12", "52:10"],
  ["Vụ Án Bí Ẩn Tháng 11", "Có thật", "Năm 2019, một gia đình mất tích không dấu vết ở Đà Lạt...", "Phóng sự điều tra", "24 tập", "38.9K", "31", "28:14"],
  ["Tiếng Gỗ Lúc Nửa Đêm", "Truyện ma", "Mỗi đêm đúng 0 giờ, căn phòng 404 lại vang lên ba tiếng gõ...", "Ngô Bảo Châu", "48 tập", "22.1K", "", "34:50"],
  ["Vùng Đất Hứa", "Cổ trang", "Vị tướng trẻ dẫn quân vượt sa mạc để tìm vùng đất trù phú...", "Phạm Văn Khoa", "520 tập", "38.1K", "", "61:40"],
] as const

export function AudioCard({ rank }: { rank: number }) {
  const item = stories[(rank - 1) % stories.length]
  return (
    <div className="flex items-center gap-4 rounded-lg border p-4 bg-card hover:bg-accent transition-colors">
      <Button variant="outline" size="icon" className="h-12 w-12 shrink-0">
        <Play className="h-5 w-5" />
      </Button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{item[0]}</h3>
          <Badge variant="outline">{item[1]}</Badge>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item[2]}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>{item[3]}</span>
          <span>{item[4]}</span>
          <span>◉ {item[5]} lượt nghe</span>
          <span className="text-green-600 flex items-center gap-1">
            <Users className="h-3.5 w-3.5 animate-pulse" />
            42 đang nghe
          </span>
        </div>
      </div>
      <span className="shrink-0 text-sm text-muted-foreground">{item[7]}</span>
    </div>
  )
}