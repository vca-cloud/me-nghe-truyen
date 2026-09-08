import { AdminShell } from "@/components/admin/admin-shell"
import { CategoryManager } from "@/components/admin/category-manager"

export default function CategoriesPage() {
  return (
    <AdminShell>
      <CategoryManager />
    </AdminShell>
  )
}
