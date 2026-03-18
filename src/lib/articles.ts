import { createServerClient } from './supabase'
import type { Article, ArticleListParams, PaginatedArticles } from '@/types'

export async function getArticles(params: ArticleListParams = {}): Promise<PaginatedArticles> {
  const { page = 1, pageSize = 12, category, status = 'published' } = params
  const supabase = createServerClient()

  let query = supabase
    .from('articles')
    .select('*', { count: 'exact' })
    .eq('status', status)
    .order('published_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
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

export async function getArticle(slug: string): Promise<Article | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

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
