export interface Category {
  id: number
  name: string
  slug: string
  stories: number
  plays: string
  visible: boolean
}

export const categories: Category[] = [
  { id: 1, name: "Cổ trang", slug: "cot-trang", stories: 240, plays: "1.2M", visible: true },
  { id: 2, name: "Truyện ma", slug: "truyen-ma", stories: 48, plays: "890K", visible: true },
  { id: 3, name: "Hiện đại", slug: "hien-dai", stories: 96, plays: "670K", visible: false },
]
