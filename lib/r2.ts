import { AwsClient } from "aws4fetch"
import { R2_PUBLIC_URL } from "@/lib/r2-public"

// Truy cập R2 qua S3 API (chỉ phía server). Cần khóa R2 "Object Read & Write" giới hạn đúng bucket.
export class R2NotConfiguredError extends Error {}

export function r2Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
  const bucket = process.env.R2_BUCKET_NAME?.trim()
  const publicBase = R2_PUBLIC_URL
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    // Chỉ nêu tên biến thiếu (không bao giờ in giá trị) để chủ dự án biết cần thêm gì trên Vercel.
    const missing = Object.entries({ CLOUDFLARE_ACCOUNT_ID: accountId, R2_ACCESS_KEY_ID: accessKeyId, R2_SECRET_ACCESS_KEY: secretAccessKey, R2_BUCKET_NAME: bucket })
      .filter(([, value]) => !value).map(([name]) => name)
    throw new R2NotConfiguredError(`Thiếu biến môi trường trên Vercel: ${missing.join(", ")}. Thêm xong phải Redeploy mới có hiệu lực.`)
  }
  return {
    client: new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" }),
    bucketUrl: `https://${accountId}.r2.cloudflarestorage.com/${encodeURIComponent(bucket)}`,
    publicBase,
  }
}

export const encodeKey = (key: string) => key.split("/").map(encodeURIComponent).join("/")

export function publicUrlFor(key: string) {
  return `${r2Config().publicBase}/${encodeKey(key)}`
}

const decodeXml = (value: string) => value
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/&amp;/g, "&")

const tag = (xml: string, name: string) => xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1]

export type R2File = { key: string; size: number; lastModified: string }

// Liệt kê một "thư mục" (prefix) với delimiter "/": thư mục con + file trực tiếp.
export async function listR2(prefix: string) {
  const { client, bucketUrl } = r2Config()
  const folders = new Set<string>()
  const files: R2File[] = []
  let token: string | undefined
  for (let page = 0; page < 20; page++) {
    const params = new URLSearchParams({ "list-type": "2", delimiter: "/", prefix, "max-keys": "1000" })
    if (token) params.set("continuation-token", token)
    const response = await client.fetch(`${bucketUrl}?${params}`)
    const xml = await response.text()
    if (!response.ok) throw new Error(`R2 từ chối liệt kê (${response.status}): ${decodeXml(tag(xml, "Message") ?? xml.slice(0, 120))}`)
    for (const block of xml.match(/<CommonPrefixes>[\s\S]*?<\/CommonPrefixes>/g) ?? []) {
      const folder = tag(block, "Prefix")
      if (folder) folders.add(decodeXml(folder))
    }
    for (const block of xml.match(/<Contents>[\s\S]*?<\/Contents>/g) ?? []) {
      const key = decodeXml(tag(block, "Key") ?? "")
      if (!key || key === prefix) continue
      files.push({ key, size: Number(tag(block, "Size") ?? 0), lastModified: tag(block, "LastModified") ?? "" })
    }
    if (tag(xml, "IsTruncated") !== "true") break
    token = decodeXml(tag(xml, "NextContinuationToken") ?? "")
    if (!token) break
  }
  return { folders: [...folders], files }
}

// URL PUT có chữ ký để trình duyệt tải file thẳng lên R2 (bucket cần CORS cho origin của site).
export async function presignPut(key: string, contentType: string, expiresSeconds = 600) {
  const { client, bucketUrl } = r2Config()
  const signed = await client.sign(
    new Request(`${bucketUrl}/${encodeKey(key)}?X-Amz-Expires=${expiresSeconds}`, { method: "PUT", headers: { "Content-Type": contentType } }),
    { aws: { signQuery: true, allHeaders: true } },
  )
  return signed.url
}
