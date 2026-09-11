import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Lock } from "lucide-react"
import type { Episode } from "@/lib/supabase"

interface EpisodeListProps {
  episodes: Episode[]
  selectedEpisode: number
  onSelect: (episode: Episode) => void
  status?: string | null
}

export function EpisodeList({ episodes, selectedEpisode, onSelect, status }: EpisodeListProps) {
  const [localSelected, setLocalSelected] = useState(selectedEpisode)

  const handleSelect = (episode: Episode) => {
    setLocalSelected(episode.episode_number)
    onSelect(episode)
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Danh sách tập</h3>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {episodes.map((episode) => {
            const isSelected = episode.episode_number === localSelected
            return (
            <Button
              key={episode.id}
              variant={isSelected ? "default" : "outline"}
              className="h-auto w-full justify-start px-4 py-3 text-left"
              onClick={() => handleSelect(episode)}
            >
              <div className="flex w-full items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border bg-background">
                  <Play className="h-4 w-4 text-[#154B95]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`truncate font-medium ${isSelected ? "text-white dark:text-[#154B95]" : "text-[#154B95]"}`}>Tập {episode.episode_number}</div>
                  <div className={`truncate text-sm font-medium ${isSelected ? "text-white/90 dark:text-[#154B95]" : "text-[#154B95]"}`}>{episode.title}</div>
                </div>
                <div className="flex-shrink-0">
                  {status === "locked" ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Badge variant="outline" className="bg-background text-[#154B95]">
                      {episode.duration || "0:00"}
                    </Badge>
                  )}
                </div>
              </div>
            </Button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
