// Địa chỉ công khai của bucket R2 (r2.dev). Không phải bí mật — nằm sẵn trong mọi link audio/ảnh bìa —
// nên có giá trị mặc định; NEXT_PUBLIC_R2_PUBLIC_URL (nếu đặt) sẽ ghi đè.
const DEFAULT_R2_PUBLIC_URL = "https://pub-b9073049650e4965b2047af671bd9dc2.r2.dev"

export const R2_PUBLIC_URL = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim() || DEFAULT_R2_PUBLIC_URL).replace(/\/$/, "")
