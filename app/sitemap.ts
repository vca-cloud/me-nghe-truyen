import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/site-url"
import { getStoryList, storyPath } from "@/lib/track-data"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const stories = await getStoryList()
  const now = new Date()
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...["/about", "/privacy", "/terms", "/contact"].map((path) => ({ url: `${siteUrl}${path}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 })),
  ]
  return [
    ...staticPages,
    ...stories.map((story) => ({ url: `${siteUrl}/track/${storyPath(story)}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
  ]
}
