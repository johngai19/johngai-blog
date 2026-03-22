import { createServerClient } from './supabase'
import type { Article, ArticleListParams, PaginatedArticles } from '@/types'

export async function getArticles(params: ArticleListParams = {}): Promise<PaginatedArticles> {
  const { page = 1, pageSize = 12, category, status = 'published', search } = params
  const supabase = createServerClient()

  let query = supabase
    .from('articles')
    .select('*', { count: 'exact' })
    .eq('status', status)
    .order('published_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  if (search) {
    // Search in both Chinese and English titles and content
    query = query.or(
      `title_zh.ilike.%${search}%,title_en.ilike.%${search}%,content_zh.ilike.%${search}%,content_en.ilike.%${search}%`
    )
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching articles:', error)
    return { articles: [], total: 0, page, pageSize, totalPages: 0 }
  }

  const total = count ?? 0
  return {
    articles: (data as Article[]) ?? [],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getArticle(slug: string, preview = false): Promise<Article | null> {
  const supabase = createServerClient()
  const decodedSlug = decodeURIComponent(slug)

  let query = supabase
    .from('articles')
    .select('*')
    .eq('slug', decodedSlug)

  if (!preview) {
    query = query.eq('status', 'published')
  }

  const { data, error } = await query.single()

  if (error) {
    console.error('Error fetching article:', error)
    return null
  }

  return data as Article
}

export async function getFeaturedArticles(limit = 3): Promise<Article[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured articles:', error)
    return []
  }

  return (data as Article[]) ?? []
}

export async function getRelatedArticles(
  slug: string,
  category: string | null,
  limit = 3
): Promise<Article[]> {
  const supabase = createServerClient()

  let query = supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching related articles:', error)
    return []
  }

  return (data as Article[]) ?? []
}

export async function getCategories(): Promise<string[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('articles')
    .select('category')
    .eq('status', 'published')
    .not('category', 'is', null)

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  const cats = (data ?? []).map((d: { category: string | null }) => d.category).filter(Boolean) as string[]
  return [...new Set(cats)].sort()
}

export async function incrementViewCount(slug: string): Promise<void> {
  try {
    const supabase = createServerClient()
    await supabase.rpc('increment_view_count', { article_slug: slug })
  } catch {
    // Silently fail — view count is non-critical
  }
}

export function getTitle(article: Article, lang: 'zh' | 'en'): string {
  if (lang === 'zh') return article.title_zh || article.title_en || 'Untitled'
  return article.title_en || article.title_zh || 'Untitled'
}

export function getExcerpt(article: Article, lang: 'zh' | 'en'): string {
  if (lang === 'zh') return article.excerpt_zh || article.excerpt_en || ''
  return article.excerpt_en || article.excerpt_zh || ''
}

export function getContent(article: Article, lang: 'zh' | 'en'): string {
  if (lang === 'zh') return article.content_zh || article.content_en || ''
  return article.content_en || article.content_zh || ''
}

export interface SearchResult {
  article: Article
  snippet: string
}

/**
 * Search articles by keyword across title, excerpt, and content (both languages).
 * Returns articles with a plain-text snippet showing where the match was found.
 */
export async function searchArticles(
  q: string,
  limit = 20
): Promise<SearchResult[]> {
  if (!q.trim()) return []

  const supabase = createServerClient()
  const term = q.trim()

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .or(
      `title_zh.ilike.%${term}%,title_en.ilike.%${term}%,excerpt_zh.ilike.%${term}%,excerpt_en.ilike.%${term}%,content_zh.ilike.%${term}%,content_en.ilike.%${term}%`
    )
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error searching articles:', error)
    return []
  }

  const articles = (data as Article[]) ?? []
  return articles.map((article) => ({
    article,
    snippet: extractSnippet(article, term),
  }))
}

/** Extract a ~150-char snippet from the article showing the match context. */
function extractSnippet(article: Article, term: string): string {
  const termLower = term.toLowerCase()

  // Prefer excerpt fields first (already short), then content
  const candidates = [
    article.excerpt_zh,
    article.excerpt_en,
    article.content_zh,
    article.content_en,
  ]

  for (const text of candidates) {
    if (!text) continue
    const idx = text.toLowerCase().indexOf(termLower)
    if (idx === -1) continue
    const start = Math.max(0, idx - 60)
    const end = Math.min(text.length, idx + 90)
    let snippet = text.slice(start, end).replace(/[#*`>]/g, '').trim()
    if (start > 0) snippet = '…' + snippet
    if (end < text.length) snippet = snippet + '…'
    return snippet
  }

  // Fallback: return whichever excerpt exists
  return (article.excerpt_zh || article.excerpt_en || '').slice(0, 150)
}
