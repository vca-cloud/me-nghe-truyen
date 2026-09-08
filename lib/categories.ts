import { supabase } from "@/lib/supabase"

export interface Category {
  id: number
  name: string
  icon: string | null
  slug: string
  stories_count: number
  plays_count: string
  is_visible: boolean
  created_at?: string
}

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }

  return data as Category[]
}

export async function getVisibleCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_visible", true)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching visible categories:", error)
    return []
  }

  return data as Category[]
}
