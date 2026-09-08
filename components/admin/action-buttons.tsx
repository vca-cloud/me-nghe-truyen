import { Edit, Lock, MoreHorizontal, Trash2, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ActionButtonsProps {
  onEdit?: () => void
  onDelete?: () => void
  onLock?: () => void
  onUnlock?: () => void
  showDropdown?: boolean
}

export function ActionButtons({ onEdit, onDelete, onLock, onUnlock }: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" aria-label="Sửa" title="Sửa" onClick={onEdit}>
        <Edit className="h-4 w-4" />
      </Button>
      {onLock && (
        <Button variant="ghost" size="icon" aria-label="Khóa" title="Khóa" onClick={onLock}>
          <Lock className="h-4 w-4" />
        </Button>
      )}
      {onUnlock && (
        <Button variant="ghost" size="icon" aria-label="Mở khóa" title="Mở khóa" onClick={onUnlock}>
          <Unlock className="h-4 w-4" />
        </Button>
      )}
      {onDelete && (
        <Button variant="ghost" size="icon" aria-label="Xóa" title="Xóa" onClick={onDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <Button variant="ghost" size="icon" aria-label="Thêm hành động" title="Thêm hành động">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  )
}
