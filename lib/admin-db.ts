export const ADMIN_WRITABLE_TABLES = ["stories", "episodes", "categories", "affiliate_links"] as const

export type AdminWritableTable = (typeof ADMIN_WRITABLE_TABLES)[number]
type Row = Record<string, unknown>
type Match = Record<string, string | number | boolean>

export type AdminWriteRequest =
  | { table: AdminWritableTable; op: "insert"; values: Row | Row[]; select?: boolean }
  | { table: AdminWritableTable; op: "update"; values: Row; match: Match; select?: boolean }
  | { table: AdminWritableTable; op: "delete"; match: Match; select?: boolean }

export type AdminWriteResult<T = Row[]> = { data: T | null; error: { message: string } | null }

export async function adminWrite<T = Row[]>(request: AdminWriteRequest): Promise<AdminWriteResult<T>> {
  try {
    const response = await fetch("/api/admin/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })
    const payload = (await response.json().catch(() => null)) as AdminWriteResult<T> | null
    if (!payload) return { data: null, error: { message: `Lỗi máy chủ (${response.status})` } }
    if (response.status === 401) return { data: null, error: { message: "Phiên đăng nhập admin đã hết hạn, vui lòng đăng nhập lại." } }
    return payload
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : "Không kết nối được máy chủ" } }
  }
}
