import { supabase } from "@/lib/supabase"
import { categories as fallbackCategories } from "@/lib/category-data"

export interface CategoryOption {
  id: number | string
  name: string
  slug?: string
  visible: boolean
}

const fallbackOptions: CategoryOption[] = fallbackCategories.map((category) => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  visible: category.visible,
}))

function readCachedCategories(): CategoryOption[] {
  if (typeof window === "undefined") return []
  try {
    const cached = localStorage.getItem("admin-categories")
    if (!cached) return []
    const parsed = JSON.parse(cached) as Array<{ id?: number | string; name?: string; slug?: string; is_visible?: boolean; visible?: boolean }>
    return parsed
      .filter((category) => Boolean(category.name))
      .map((category, index) => ({
        id: category.id ?? `cached-${index}`,
        name: category.name!,
        slug: category.slug,
        visible: category.is_visible ?? category.visible ?? true,
      }))
  } catch {
    return []
  }
}

export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, is_visible")
    .eq("is_visible", true)
    .order("name", { ascending: true })

  if (!error && data?.length) {
    const options = data.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      visible: true,
    }))
    if (typeof window !== "undefined") localStorage.setItem("admin-categories", JSON.stringify(data))
    return options
  }

  const cached = readCachedCategories().filter((category) => category.visible)
  return cached.length ? cached : fallbackOptions.filter((category) => category.visible)
}
