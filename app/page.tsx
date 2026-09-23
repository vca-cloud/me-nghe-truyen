import { HomePage } from "@/components/home-page"
import { getHomeStories } from "@/lib/home-stories"

export const revalidate = 60

export default async function Page() {
  const stories = await getHomeStories().catch((error: unknown) => {
    console.error("Home page stories error:", error instanceof Error ? error.message : error)
    return null
  })
  return <HomePage initialStories={stories} />
}
