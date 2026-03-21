import { NextRequest, NextResponse } from 'next/server'
import { getArticles, getArticle } from '@/lib/articles'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    if (slug) {
      const article = await getArticle(slug)
      if (!article) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }
      return NextResponse.json(article)
    }

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') ?? '12', 10)))
    const category = searchParams.get('category') ?? undefined
    const lang = (searchParams.get('lang') ?? 'zh') as 'zh' | 'en'
    const search = searchParams.get('search') ?? undefined

    const result = await getArticles({ page, pageSize, category, lang, search })
    return NextResponse.json(result)
  } catch (err) {
    console.error('Articles API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
