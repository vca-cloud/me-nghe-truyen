// Loại báo lỗi dùng chung cho form người nghe, API và trang admin.
export const ISSUE_KINDS = {
  cannot_play: "Không phát được audio",
  bad_audio: "Âm thanh rè, mất tiếng, bị ngắt",
  wrong_content: "Sai tập / sai nội dung",
  slow: "Tải chậm, hay bị dừng",
  popup: "Lỗi nút mở khóa / link Shopee",
  other: "Lỗi khác",
  audio_error: "Tự ghi nhận: không tải được audio",
} as const

export type IssueKind = keyof typeof ISSUE_KINDS

// Loại người nghe được chọn trong form (audio_error chỉ do player tự gửi).
export const USER_ISSUE_KINDS = (Object.keys(ISSUE_KINDS) as IssueKind[]).filter((kind) => kind !== "audio_error")

export function isIssueKind(value: unknown): value is IssueKind {
  return typeof value === "string" && value in ISSUE_KINDS
}

// Mã lỗi của thẻ <audio> (MediaError.code) → mô tả ngắn cho admin.
export function describeMediaError(code: number | undefined) {
  switch (code) {
    case 1: return "MEDIA_ERR_ABORTED (bị hủy tải)"
    case 2: return "MEDIA_ERR_NETWORK (lỗi mạng khi tải file)"
    case 3: return "MEDIA_ERR_DECODE (file hỏng, không giải mã được)"
    case 4: return "MEDIA_ERR_SRC_NOT_SUPPORTED (link hỏng/không tồn tại hoặc định dạng không hỗ trợ)"
    default: return "Không rõ mã lỗi"
  }
}
