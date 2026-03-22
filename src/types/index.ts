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
  status: 'draft' | 'published' | 'archived' | 'scheduled'
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
  'engineering',
  'industry',
  'books',
  'life',
  'startup',
  'writing',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABELS: Record<string, { zh: string; en: string; color: string }> = {
  engineering: { zh: '工程与技术', en: 'Engineering', color: 'bg-blue-50 text-blue-700' },
  industry: { zh: '工业与行业', en: 'Industry', color: 'bg-slate-50 text-slate-700' },
  books: { zh: '读书与思想', en: 'Books & Ideas', color: 'bg-purple-50 text-purple-700' },
  life: { zh: '人生随笔', en: 'Life Notes', color: 'bg-green-50 text-green-700' },
  startup: { zh: '创业与经营', en: 'Startup', color: 'bg-amber-50 text-amber-700' },
  writing: { zh: '文学与创作', en: 'Writing', color: 'bg-rose-50 text-rose-700' },
}
