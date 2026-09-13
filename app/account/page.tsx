import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AccountPage } from "@/components/account/account-page"
import { getAuthenticatedUser } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export default async function AccountRoute() {
  const { user } = await getAuthenticatedUser()
  if (!user) redirect("/login?next=/account")
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
        <AccountPage user={{ email: user.email || "", createdAt: user.created_at, metadata: user.user_metadata || {} }} />
      </main>
      <Footer />
    </div>
  )
}
