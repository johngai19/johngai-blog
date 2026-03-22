import { NextRequest, NextResponse } from 'next/server'
import { searchArticles } from '@/lib/articles'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') ?? ''
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))

    if (!q.trim()) {
      return NextResponse.json({ results: [], total: 0, query: q })
    }

    const results = await searchArticles(q, limit)

    return NextResponse.json({
      results,
      total: results.length,
      query: q,
    })
  } catch (err) {
    console.error('Search API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
