export type SignupFields = { name: string; email: string; password: string; confirm: string }
export type SignupErrors = Partial<Record<keyof SignupFields, string>>

const EMAIL_PATTERN = /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/
const NAME_PATTERN = /^[\p{L}][\p{L}\s'.-]{1,49}$/u

export const PASSWORD_RULES = [
  { id: "length", label: "Ít nhất 8 ký tự", test: (value: string) => value.length >= 8 },
  { id: "letter", label: "Có ít nhất 1 chữ cái", test: (value: string) => /\p{L}/u.test(value) },
  { id: "number", label: "Có ít nhất 1 chữ số", test: (value: string) => /\d/.test(value) },
  { id: "space", label: "Không có khoảng trắng", test: (value: string) => value.length > 0 && !/\s/.test(value) },
] as const

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function validateEmail(value: string) {
  const email = normalizeEmail(value)
  if (!email) return "Vui lòng nhập email."
  if (!EMAIL_PATTERN.test(email) || email.includes("..")) return "Email không đúng định dạng, ví dụ: tenban@gmail.com"
  const [local, domain] = email.split("@")
  // Bot thường tạo Gmail kiểu a.b.c.d@gmail.com; Gmail bỏ qua dấu chấm nên người thật hiếm khi cần nhiều hơn 2.
  if ((domain === "gmail.com" || domain === "googlemail.com") && (local.match(/\./g)?.length ?? 0) >= 3) {
    return "Email Gmail có quá nhiều dấu chấm. Vui lòng nhập đúng địa chỉ Gmail bạn đang dùng."
  }
  return undefined
}

export function validateSignup(fields: SignupFields): SignupErrors {
  const errors: SignupErrors = {}
  const name = fields.name.trim().replace(/\s+/g, " ")
  if (!name) errors.name = "Vui lòng nhập họ tên."
  else if (!NAME_PATTERN.test(name)) errors.name = "Họ tên từ 2–50 ký tự, chỉ gồm chữ cái và khoảng trắng."

  const emailError = validateEmail(fields.email)
  if (emailError) errors.email = emailError

  const failed = PASSWORD_RULES.filter((rule) => !rule.test(fields.password))
  if (!fields.password) errors.password = "Vui lòng nhập mật khẩu."
  else if (failed.length) errors.password = `Mật khẩu chưa đạt: ${failed.map((rule) => rule.label.toLowerCase()).join(", ")}.`

  if (!fields.confirm) errors.confirm = "Vui lòng nhập lại mật khẩu."
  else if (fields.confirm !== fields.password) errors.confirm = "Mật khẩu nhập lại không khớp."

  return errors
}

export function translateAuthError(message: string) {
  const text = message.toLowerCase()
  if (text.includes("already registered") || text.includes("already exists")) return "Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác."
  if (text.includes("rate limit") || text.includes("too many")) return "Bạn thao tác quá nhanh. Vui lòng đợi vài phút rồi thử lại."
  if (text.includes("password")) return "Mật khẩu chưa đủ mạnh theo yêu cầu. Vui lòng chọn mật khẩu khác."
  if (text.includes("email") && text.includes("invalid")) return "Email không hợp lệ. Vui lòng kiểm tra lại."
  if (text.includes("captcha")) return "Xác minh chống bot thất bại. Vui lòng tải lại trang và thử lại."
  return `Đăng ký thất bại: ${message}`
}
