export interface ParsedStory {
  title: string
  author: string
  genre: string
  description: string
  cover_url?: string
  text_url?: string
  status: string
  episodes: Array<{
    episode_number: number
    title: string
    audio_url: string
    duration: string
  }>
}

export interface ParseError {
  line: number
  field: string
  message: string
}

export interface ParseResult {
  stories: ParsedStory[]
  errors: ParseError[]
}

function parseCSVRecords(content: string): Array<{ values: string[]; line: number }> {
  const records: Array<{ values: string[]; line: number }> = []
  let values: string[] = []
  let current = ""
  let inQuotes = false
  let line = 1
  let recordLine = 1

  const pushField = () => {
    values.push(current.trim())
    current = ""
  }
  const pushRecord = () => {
    pushField()
    if (values.some((value) => value.trim())) records.push({ values, line: recordLine })
    values = []
  }

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const nextChar = content[i + 1]

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"'
      i++
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "\n" && !inQuotes) {
      pushRecord()
      line++
      recordLine = line
    } else if (char === "\r") {
      if (nextChar === "\n") continue
      if (!inQuotes) {
        pushRecord()
        line++
        recordLine = line
      } else {
        current += char
      }
    } else if (char === "," && !inQuotes) {
      pushField()
    } else {
      current += char
      if (char === "\n") line++
    }
  }

  if (current || values.length) pushRecord()
  return records
}

export function parseCSV(content: string): ParseResult {
  const records = parseCSVRecords(content)
  if (records.length === 0) {
    return { stories: [], errors: [{ line: 0, field: "file", message: "File CSV rỗng" }] }
  }

  const headers = records[0].values.map((h) => h.toLowerCase().trim())

  const requiredFields = ["title", "audio_url"]
  const missingFields = requiredFields.filter((field) => !headers.includes(field))
  if (missingFields.length > 0) {
    return {
      stories: [],
      errors: [{ line: 1, field: "header", message: `Thiếu cột bắt buộc: ${missingFields.join(", ")}` }],
    }
  }

  const rows: Array<Record<string, string>> = []
  const errors: ParseError[] = []

  for (let i = 1; i < records.length; i++) {
    const record = records[i]
    const values = record.values

    if (values.length !== headers.length) {
      errors.push({ line: record.line, field: "row", message: `Số cột không khớp (${values.length} vs ${headers.length})` })
      continue
    }

    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = (values[index] || "").trim()
    })

    if (!row.title && !row.audio_url) continue

    rows.push(row)
  }

  return groupRowsIntoStories(rows, errors, 1)
}

export function parseJSON(content: string): ParseResult {
  const errors: ParseError[] = []

  try {
    const data = JSON.parse(content)
    if (!Array.isArray(data)) {
      return { stories: [], errors: [{ line: 0, field: "root", message: "JSON phải là mảng" }] }
    }

    if (data.length === 0) {
      return { stories: [], errors: [] }
    }

    const firstItem = data[0]
    if (firstItem.episodes && Array.isArray(firstItem.episodes)) {
      return parseNestedJSON(data, errors)
    }

    return groupRowsIntoStories(data, errors, 0)
  } catch (error) {
    const message = error instanceof Error ? error.message : "JSON không hợp lệ"
    return { stories: [], errors: [{ line: 0, field: "parse", message }] }
  }
}

function parseNestedJSON(data: unknown[], errors: ParseError[]): ParseResult {
  const stories: ParsedStory[] = []

  data.forEach((item, index) => {
    if (typeof item !== "object" || item === null) {
      errors.push({ line: index + 1, field: "item", message: "Item không phải object" })
      return
    }

    const obj = item as Record<string, unknown>
    const title = String(obj.title || "").trim()
    if (!title) {
      errors.push({ line: index + 1, field: "title", message: "Thiếu title" })
      return
    }

    const episodesData = obj.episodes
    if (!Array.isArray(episodesData) || episodesData.length === 0) {
      errors.push({ line: index + 1, field: "episodes", message: `Truyện "${title}" không có tập nào` })
      return
    }

    const episodes: ParsedStory["episodes"] = []
    episodesData.forEach((ep, epIndex) => {
      if (typeof ep !== "object" || ep === null) return
      const epObj = ep as Record<string, unknown>
      const audioUrl = String(epObj.audio_url || "").trim()
      if (!audioUrl) {
        errors.push({ line: index + 1, field: "audio_url", message: `Tập ${epIndex + 1} thiếu audio_url` })
        return
      }

      episodes.push({
        episode_number: Number(epObj.episode_number) || epIndex + 1,
        title: String(epObj.title || epObj.episode_title || "").trim() || `Tập ${epIndex + 1}`,
        audio_url: audioUrl,
        duration: String(epObj.duration || "").trim(),
      })
    })

    if (episodes.length === 0) return

    stories.push({
      title,
      author: String(obj.author || "").trim(),
      genre: String(obj.genre || "").trim(),
      description: String(obj.description || "").trim(),
      cover_url: String(obj.cover_url || "").trim() || undefined,
      text_url: String(obj.text_url || "").trim() || undefined,
      status: String(obj.status || "").trim() || "Đang cập nhật",
      episodes,
    })
  })

  return { stories, errors }
}

function groupRowsIntoStories(rows: Array<Record<string, unknown>>, errors: ParseError[], startLine: number): ParseResult {
  const grouped = new Map<string, Array<{ row: Record<string, unknown>; index: number }>>()

  rows.forEach((row, index) => {
    const title = String(row.title || "").trim()
    if (!title) {
      errors.push({ line: startLine + index + 1, field: "title", message: "Thiếu title" })
      return
    }

    const audioUrl = String(row.audio_url || "").trim()
    if (!audioUrl) {
      errors.push({ line: startLine + index + 1, field: "audio_url", message: "Thiếu audio_url" })
      return
    }

    const normalizedTitle = title.toLowerCase()
    const items = grouped.get(normalizedTitle) || []
    items.push({ row, index })
    grouped.set(normalizedTitle, items)
  })

  const stories: ParsedStory[] = []

  grouped.forEach((items) => {
    if (items.length === 0) return

    const firstRow = items[0].row
    const title = String(firstRow.title || "").trim()

    const episodes: ParsedStory["episodes"] = items.map((item, epIndex) => {
      const row = item.row
      return {
        episode_number: Number(row.episode_number) || epIndex + 1,
        title: String(row.episode_title || row.title || "").trim() || `Tập ${epIndex + 1}`,
        audio_url: String(row.audio_url || "").trim(),
        duration: String(row.duration || "").trim(),
      }
    })

    stories.push({
      title,
      author: String(firstRow.author || "").trim(),
      genre: String(firstRow.genre || "").trim(),
      description: String(firstRow.description || "").trim(),
      cover_url: String(firstRow.cover_url || "").trim() || undefined,
      text_url: String(firstRow.text_url || "").trim() || undefined,
      status: String(firstRow.status || "").trim() || "Đang cập nhật",
      episodes,
    })
  })

  return { stories, errors }
}
