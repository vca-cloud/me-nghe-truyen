// Cắt giữa về tỷ lệ 4:5, thu tối đa 1080×1350 và mã hóa WebP (JPEG nếu trình duyệt không hỗ trợ mã hóa WebP).
export const COVER_WIDTH = 1080
export const COVER_HEIGHT = 1350

export async function toCoverImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const targetRatio = COVER_WIDTH / COVER_HEIGHT
  let sw = bitmap.width
  let sh = bitmap.height
  if (sw / sh > targetRatio) sw = Math.round(sh * targetRatio)
  else sh = Math.round(sw / targetRatio)
  const sx = Math.round((bitmap.width - sw) / 2)
  const sy = Math.round((bitmap.height - sh) / 2)
  const width = Math.min(COVER_WIDTH, sw)
  const height = Math.round(width / targetRatio)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.")
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height)
  bitmap.close()

  const encode = (type: string, quality: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
  const webp = await encode("image/webp", 0.85)
  const blob = webp?.type === "image/webp" ? webp : await encode("image/jpeg", 0.85)
  if (!blob) throw new Error("Không chuyển được ảnh.")
  return { blob, width, height }
}
