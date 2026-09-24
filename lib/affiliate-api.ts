import { adminWrite } from "@/lib/admin-db"
import { supabase } from "@/lib/supabase"

export interface AffiliateLink {
  id: number
  title: string
  shoppe_url: string
  image_url: string | null
  is_active: boolean
  clicks: number
  created_at?: string
  updated_at?: string
}

export type AffiliateLinkPayload = Pick<AffiliateLink, "title" | "shoppe_url" | "image_url" | "is_active">

function throwSupabaseError(error: { message?: string } | null) {
  if (error) throw new Error(error.message || "Không thể kết nối Supabase")
}

export async function getAffiliateLinks() {
  const result = await supabase.from("affiliate_links").select("*").order("created_at", { ascending: false })
  throwSupabaseError(result.error)
  return (result.data || []) as AffiliateLink[]
}

export async function createAffiliateLink(payload: AffiliateLinkPayload) {
  const result = await adminWrite<AffiliateLink[]>({ table: "affiliate_links", op: "insert", values: { ...payload }, select: true })
  throwSupabaseError(result.error)
  return result.data?.[0] as AffiliateLink
}

export async function updateAffiliateLink(id: number, payload: AffiliateLinkPayload) {
  const result = await adminWrite<AffiliateLink[]>({ table: "affiliate_links", op: "update", values: { ...payload, updated_at: new Date().toISOString() }, match: { id }, select: true })
  throwSupabaseError(result.error)
  return result.data?.[0] as AffiliateLink
}

export async function deleteAffiliateLink(id: number) {
  const result = await adminWrite({ table: "affiliate_links", op: "delete", match: { id } })
  throwSupabaseError(result.error)
}
