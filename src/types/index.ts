export interface Article {
  id: string
  slug: string
  title_zh: string | null
  title_en: string | null
  content_zh: string | null
  content_en: string | null
  excerpt_zh: string | null
  excerpt_en: string | null
  cover_image: string | null
  category: string | null
  tags: string[] | null
  status: 'draft' | 'published' | 'archived'
  source: string | null
  source_url: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  view_count: number
  reading_time_min: number | null
}

export interface EmailSubscriber {
  id: string
  email: string
  confirmed: boolean
  language: 'zh' | 'en' | 'both'
  created_at: string
}

export type Lang = 'zh' | 'en'

export interface ArticleListParams {
  page?: number
  pageSize?: number
  category?: string
  lang?: Lang
  status?: string
  search?: string
}

export interface PaginatedArticles {
  articles: Article[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const CATEGORIES = [
  'technology',
  'life',
  'reading',
  'travel',
  'thoughts',
  'tutorial',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABELS: Record<string, { zh: string; en: string; color: string }> = {
  technology: { zh: '技术', en: 'Tech', color: 'bg-blue-50 text-blue-700' },
  life: { zh: '生活', en: 'Life', color: 'bg-green-50 text-green-700' },
  reading: { zh: '读书', en: 'Reading', color: 'bg-purple-50 text-purple-700' },
  travel: { zh: '旅行', en: 'Travel', color: 'bg-amber-50 text-amber-700' },
  thoughts: { zh: '随想', en: 'Thoughts', color: 'bg-rose-50 text-rose-700' },
  tutorial: { zh: '教程', en: 'Tutorial', color: 'bg-teal-50 text-teal-700' },
}
