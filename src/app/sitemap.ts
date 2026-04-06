import type { MetadataRoute } from 'next'
import { createServerClient } from '@/lib/supabase'

export const revalidate = 3600

/**
 * Fetch all published article slugs using paginated queries.
 * Supabase caps a single request at 1 000 rows by default,
 * so we page through in batches of 1 000 to capture every article.
 */
async function fetchAllArticleSlugs() {
  const supabase = createServerClient()
  const PAGE_SIZE = 1000
  let allArticles: { slug: string; updated_at: string; published_at: string }[] = []
  let from = 0

  let hasMore = true
  while (hasMore) {
    const { data } = await supabase
      .from('articles')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (!data || data.length === 0) {
      hasMore = false
    } else {
      allArticles = allArticles.concat(data)
      if (data.length < PAGE_SIZE) {
        hasMore = false
      } else {
        from += PAGE_SIZE
      }
    }
  }

  return allArticles
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.johngai.com'

  const articles = await fetchAllArticleSlugs()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/subscribe`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/articles/${article.slug}`,
    lastModified: new Date(article.updated_at || article.published_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...articlePages]
}
