import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Thiếu biến môi trường Supabase.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Episode {
  id: number
  story_id: number
  episode_number: number
  title: string
  audio_url: string
  duration: string | null
}

/** Checks whether the episodes migration has been applied. DDL must run via Supabase migrations. */
export async function ensureEpisodesTable() {
  const { error } = await supabase.from("episodes").select("id").limit(1)
  return {
    exists: !error || !/relation .*episodes.* does not exist|table .*episodes.* not found/i.test(error.message),
    error: error ?? null,
  }
}

export async function getEpisodes(storyId: number) {
  const { data, error } = await supabase
    .from("episodes")
    .select("id, story_id, episode_number, title, audio_url, duration")
    .eq("story_id", storyId)
    .order("episode_number", { ascending: true })

  return { data: (data ?? []) as Episode[], error }
}
