import { NextResponse } from "next/server"
import { createServiceDb, hasAdminSession } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

// Hạn mức gói miễn phí; chỉnh qua biến môi trường nếu đổi gói.
const LIMITS = {
  supabaseDatabaseBytes: Number(process.env.USAGE_LIMIT_SUPABASE_DB_MB || 500) * 1024 ** 2,
  supabaseStorageBytes: Number(process.env.USAGE_LIMIT_SUPABASE_STORAGE_MB || 1024) * 1024 ** 2,
  supabaseMau: Number(process.env.USAGE_LIMIT_SUPABASE_MAU || 50_000),
  r2StorageBytes: Number(process.env.USAGE_LIMIT_R2_STORAGE_GB || 10) * 1024 ** 3,
  r2ClassA: Number(process.env.USAGE_LIMIT_R2_CLASS_A || 1_000_000),
  r2ClassB: Number(process.env.USAGE_LIMIT_R2_CLASS_B || 10_000_000),
}

// Thao tác đọc (Class B) theo bảng giá R2; thao tác xóa/hủy miễn phí; còn lại là Class A (ghi/liệt kê).
const R2_CLASS_B = new Set(["GetObject", "HeadObject", "HeadBucket", "UsageSummary", "GetBucketEncryption", "GetBucketLocation", "GetBucketCors", "GetBucketLifecycleConfiguration"])
const R2_FREE = new Set(["DeleteObject", "DeleteBucket", "AbortMultipartUpload"])

const CACHE_MS = 60 * 60 * 1000
let cache: { at: number; data: unknown } | null = null

function monthStartUtc() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

async function supabaseUsage() {
  const db = createServiceDb()
  const { data, error } = await db.rpc("admin_system_usage")
  const since = monthStartUtc().getTime()
  let mau = 0
  let totalUsers = 0
  for (let page = 1; page <= 50; page++) {
    const { data: users, error: usersError } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (usersError) break
    totalUsers += users.users.length
    mau += users.users.filter((user) => user.last_sign_in_at && Date.parse(user.last_sign_in_at) >= since).length
    if (users.users.length < 1000) break
  }
  const usage = (data ?? {}) as { database_bytes?: number; storage_bytes?: number; storage_objects?: number; tables?: { name: string; bytes: number }[] }
  return {
    connected: !error,
    reason: error ? "Chưa chạy SQL 20250916 (hàm admin_system_usage)." : null,
    databaseBytes: Number(usage.database_bytes ?? 0),
    storageBytes: Number(usage.storage_bytes ?? 0),
    storageObjects: Number(usage.storage_objects ?? 0),
    tables: usage.tables ?? [],
    mau,
    totalUsers,
    limits: { databaseBytes: LIMITS.supabaseDatabaseBytes, storageBytes: LIMITS.supabaseStorageBytes, mau: LIMITS.supabaseMau },
    dashboardUrl: `https://supabase.com/dashboard/project/${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://x.supabase.co").hostname.split(".")[0]}/settings/usage`,
  }
}

async function r2Usage() {
  const token = process.env.CLOUDFLARE_API_TOKEN
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const bucket = process.env.R2_BUCKET_NAME || undefined
  const base = { limits: { storageBytes: LIMITS.r2StorageBytes, classA: LIMITS.r2ClassA, classB: LIMITS.r2ClassB }, dashboardUrl: accountId ? `https://dash.cloudflare.com/${accountId}/r2/overview` : "https://dash.cloudflare.com/?to=/:account/r2/overview" }
  if (!token || !accountId) return { ...base, connected: false, reason: "Chưa đặt CLOUDFLARE_API_TOKEN và CLOUDFLARE_ACCOUNT_ID trên Vercel." }

  const now = new Date()
  const query = `query($accountTag: string!, $monthStart: Time!, $storageStart: Time!, $end: Time!, $bucket: string) {
    viewer { accounts(filter: { accountTag: $accountTag }) {
      storage: r2StorageAdaptiveGroups(limit: 10000, filter: { datetime_geq: $storageStart, datetime_leq: $end, bucketName: $bucket }, orderBy: [datetime_DESC]) {
        max { payloadSize metadataSize objectCount }
        dimensions { datetime bucketName }
      }
      operations: r2OperationsAdaptiveGroups(limit: 10000, filter: { datetime_geq: $monthStart, datetime_leq: $end, bucketName: $bucket }) {
        sum { requests }
        dimensions { actionType }
      }
    } }
  }`
  const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: {
        accountTag: accountId,
        monthStart: monthStartUtc().toISOString(),
        storageStart: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
        end: now.toISOString(),
        bucket,
      },
    }),
    cache: "no-store",
  })
  const payload = await response.json().catch(() => null)
  const account = payload?.data?.viewer?.accounts?.[0]
  if (!response.ok || payload?.errors?.length || !account) {
    return { ...base, connected: false, reason: `Cloudflare trả lỗi: ${payload?.errors?.[0]?.message || response.status}` }
  }

  // Lấy bản ghi dung lượng mới nhất của từng bucket rồi cộng lại.
  const latestByBucket = new Map<string, { payloadSize: number; metadataSize: number; objectCount: number }>()
  for (const row of account.storage ?? []) {
    const name = row.dimensions?.bucketName ?? "?"
    if (!latestByBucket.has(name)) latestByBucket.set(name, row.max)
  }
  const buckets = [...latestByBucket.entries()].map(([name, max]) => ({ name, bytes: Number(max.payloadSize || 0) + Number(max.metadataSize || 0), objects: Number(max.objectCount || 0) }))

  let classA = 0
  let classB = 0
  for (const row of account.operations ?? []) {
    const action = String(row.dimensions?.actionType || "")
    const requests = Number(row.sum?.requests || 0)
    if (R2_FREE.has(action)) continue
    if (R2_CLASS_B.has(action)) classB += requests
    else classA += requests
  }

  return {
    ...base,
    connected: true,
    reason: null,
    storageBytes: buckets.reduce((sum, item) => sum + item.bytes, 0),
    objectCount: buckets.reduce((sum, item) => sum + item.objects, 0),
    buckets,
    classA,
    classB,
  }
}

export async function GET(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const refresh = new URL(request.url).searchParams.get("refresh") === "1"
  if (!refresh && cache && Date.now() - cache.at < CACHE_MS) return NextResponse.json(cache.data)

  const [supabase, r2] = await Promise.all([
    supabaseUsage().catch((error) => ({ connected: false, reason: error instanceof Error ? error.message : "Lỗi Supabase" })),
    r2Usage().catch((error) => ({ connected: false, reason: error instanceof Error ? error.message : "Lỗi Cloudflare" })),
  ])
  const data = {
    checkedAt: new Date().toISOString(),
    supabase,
    r2,
    links: {
      supabaseEgress: "https://supabase.com/dashboard/org/_/usage",
      vercelUsage: "https://vercel.com/dashboard/usage",
    },
  }
  cache = { at: Date.now(), data }
  return NextResponse.json(data)
}
