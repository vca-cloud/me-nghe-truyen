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
          {episodes.map((episode) => (
            <Button
              key={episode.id}
              variant={episode.episode_number === localSelected ? "default" : "outline"}
              className="w-full justify-start h-auto py-3 px-4 text-left"
              onClick={() => handleSelect(episode)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-background border">
                  <Play className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">Tập {episode.episode_number}</div>
                  <div className="text-sm text-muted-foreground truncate">{episode.title}</div>
                </div>
                <div className="flex-shrink-0">
                  {status === "locked" ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Badge variant="outline" className="bg-background">
                      {episode.duration || "0:00"}
                    </Badge>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
