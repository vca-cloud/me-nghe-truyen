import { supabase } from "@/lib/supabase"

interface AudioData {
  title: string
  author?: string
  genre?: string
  description?: string
  audio_url?: string
  cover_url?: string
  episodes?: number
  duration?: string
  status?: string
}

export async function getAudios() {
  const { data, error } = await supabase.from("stories").select("*").order("id", { ascending: false })
  if (error) throw error
  return data
}

export async function createAudio(data: AudioData) {
  const { error } = await supabase.from("stories").insert([data])
  if (error) throw error
}

export async function updateAudio(id: string, data: AudioData) {
  const { error } = await supabase.from("stories").update(data).eq("id", id)
  if (error) throw error
}

export async function deleteAudio(id: string) {
  const { error } = await supabase.from("stories").delete().eq("id", id)
  if (error) throw error
}
