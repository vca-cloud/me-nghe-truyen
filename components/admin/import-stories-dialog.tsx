"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Download, Upload } from "lucide-react"
import { toast } from "sonner"
import { parseCSV, parseJSON, type ParseError, type ParsedStory } from "@/lib/import-stories"
import { supabase } from "@/lib/supabase"

interface Props { onSuccess: () => void }
type Result = { success: number; skipped: number; errors: ParseError[] }

export function ImportStoriesDialog({ onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState("")
  const [results, setResults] = useState<Result | null>(null)
  const [parseErrors, setParseErrors] = useState<ParseError[]>([])

  const readFile = async (selected: File): Promise<{ stories: ParsedStory[]; errors: ParseError[] }> => {
    const content = await selected.text()
    return selected.name.toLowerCase().endsWith(".json") ? parseJSON(content) : parseCSV(content)
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    if (!selected) return
    setFile(selected); setResults(null); setProgress(0); setProgressText("")
    try { setParseErrors((await readFile(selected)).errors) } catch { setParseErrors([{ line: 0, field: "file", message: "Không thể đọc file" }]) }
  }

  const processImport = async (stories: ParsedStory[], parseErrors: ParseError[]) => {
    let success = 0
    let skipped = 0
    const errors = [...parseErrors]
    for (let index = 0; index < stories.length; index++) {
      const story = stories[index]
      try {
        const payload = {
          title: story.title, slug: story.title, author: story.author, genre: story.genre,
          description: story.description, cover_url: story.cover_url || null, status: story.status,
          plays: "0", audio_url: story.episodes[0]?.audio_url || null,
          episodes: story.episodes.length, duration: story.episodes[0]?.duration || null,
        }
        let { data, error } = await supabase.from("stories").insert([payload]).select()
        if (error?.code === "PGRST204" && error.message.includes("slug")) {
          const { slug: _slug, ...legacy } = payload
          const result = await supabase.from("stories").insert([legacy]).select()
          data = result.data; error = result.error
        }
        if (error) { skipped++; errors.push({ line: index + 1, field: "title", message: error.message }); continue }
        const storyId = data?.[0]?.id
        if (!storyId) throw new Error("Không lấy được ID truyện")
        const episodeRows = story.episodes.map((episode, episodeIndex) => ({ story_id: storyId, episode_number: episode.episode_number || episodeIndex + 1, title: episode.title || `Tập ${episodeIndex + 1}`, audio_url: episode.audio_url, duration: episode.duration || null }))
        const episodeResult = await supabase.from("episodes").insert(episodeRows)
        if (episodeResult.error) throw episodeResult.error
        success++
      } catch (error) { errors.push({ line: index + 1, field: "import", message: error instanceof Error ? error.message : "Lỗi import" }) }
      const done = index + 1
      setProgress(done / stories.length * 100)
      setProgressText(`Đã import ${done}/${stories.length} truyện...`)
    }
    setResults({ success, skipped, errors }); setLoading(false); setProgress(100)
    setProgressText(`Đã import xong! ${success} thành công, ${skipped} bỏ qua`)
    if (success) onSuccess()
    toast[errors.length ? "error" : "success"](errors.length ? `Có ${errors.length} lỗi trong quá trình import` : `Import thành công ${success} truyện!`)
  }

  const handleImport = async () => {
    if (!file || loading) return
    setLoading(true); setResults(null)
    try { const parsed = await readFile(file); setParseErrors(parsed.errors); if (!parsed.stories.length) { setLoading(false); toast.error("File không có truyện hợp lệ"); return }; await processImport(parsed.stories, parsed.errors) }
    catch (error) { setLoading(false); toast.error(error instanceof Error ? error.message : "Không thể đọc file") }
  }

  const downloadTemplate = () => { const link = document.createElement("a"); link.href = "/mau-import-truyen.csv"; link.download = "mau-import-truyen.csv"; link.click() }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger render={<Button />}><Upload className="mr-2 h-4 w-4" />Import hàng loạt</DialogTrigger>
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader><DialogTitle>Import Truyện &amp; Tập Hàng Loạt</DialogTitle><DialogDescription>Import từ CSV hoặc JSON. Mỗi dòng CSV là một tập.</DialogDescription></DialogHeader>
      <div className="space-y-5 py-4">
        <div className="space-y-2"><Label htmlFor="import-file">Chọn file CSV hoặc JSON</Label><Input id="import-file" type="file" accept=".csv,.json,text/csv,application/json" onChange={handleFileSelect} />{file && <p className="text-sm text-green-600">Đã chọn: {file.name}</p>}</div>
        {parseErrors.length > 0 && <div className="rounded bg-muted p-3 text-sm text-red-600">{parseErrors.length} lỗi dữ liệu: {parseErrors[0].message}</div>}
        {file && <p className="text-sm text-muted-foreground">Kiểm tra lỗi ở trên rồi bấm bắt đầu import.</p>}
        <Button onClick={handleImport} disabled={!file || loading} className="w-full">{loading ? "Đang import..." : "Bắt đầu import"}</Button>
        {progress > 0 && <div className="space-y-2"><div className="flex justify-between text-sm"><span>{progressText}</span><span>{Math.round(progress)}%</span></div><Progress value={progress} /></div>}
        {results && <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm"><p className="font-medium">Kết quả import</p><p>Thành công: {results.success}</p><p>Bỏ qua: {results.skipped}</p><p>Lỗi: {results.errors.length}</p></div>}
        <div className="flex gap-3 border-t pt-4"><Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button variant="outline" onClick={downloadTemplate}><Download className="mr-2 h-4 w-4" />Tải file mẫu CSV</Button></div>
      </div>
    </DialogContent>
  </Dialog>
}
