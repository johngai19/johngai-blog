'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search as SearchIcon, Clock, Eye } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import type { Article, Lang } from '@/types'
import { CATEGORY_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'

interface SearchResult {
  article: Article
  snippet: string
}

function highlightKeyword(text: string, keyword: string): React.ReactNode {
  if (!keyword.trim()) return text
  const parts = text.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase() ? (
      <mark
        key={i}
        style={{ backgroundColor: '#F5E6C8', color: '#D4830A', borderRadius: '2px', padding: '0 1px' }}
      >
        {part}
      </mark>
    ) : (
      part
    )
  )
}

function SearchResultCard({ result, lang, query }: { result: SearchResult; lang: Lang; query: string }) {
  const { article, snippet } = result
  const title =
    lang === 'zh'
      ? article.title_zh || article.title_en || 'Untitled'
      : article.title_en || article.title_zh || 'Untitled'
  const categoryInfo = article.category ? CATEGORY_LABELS[article.category] : null
  const categoryLabel = categoryInfo
    ? lang === 'zh'
      ? categoryInfo.zh
      : categoryInfo.en
    : article.category

  return (
    <article
      className="rounded-xl border p-5 transition-shadow hover:shadow-md"
      style={{ borderColor: '#E5E3DF', backgroundColor: '#FFFFFF' }}
    >
      {/* Category + date */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {categoryLabel && (
            <span
              className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                categoryInfo?.color ?? 'bg-gray-50 text-gray-600'
              }`}
            >
              {categoryLabel}
            </span>
          )}
        </div>
        <span className="text-xs" style={{ color: '#6B7280' }}>
          {formatDate(article.published_at, lang)}
        </span>
      </div>

      {/* Title */}
      <Link href={`/articles/${article.slug}?lang=${lang}`}>
        <h2
          className={`font-semibold text-base leading-snug mb-2 hover:opacity-70 transition-opacity ${
            lang === 'zh' ? 'font-[var(--font-noto-serif-sc)]' : ''
          }`}
          style={{ color: '#1A1A1A' }}
        >
          {highlightKeyword(title, query)}
        </h2>
      </Link>

      {/* Snippet */}
      {snippet && (
        <p className="text-sm leading-relaxed mb-3" style={{ color: '#6B7280' }}>
          {highlightKeyword(snippet, query)}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs" style={{ color: '#9CA3AF' }}>
        {article.reading_time_min && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {lang === 'zh'
              ? `${article.reading_time_min} 分钟`
              : `${article.reading_time_min} min`}
          </span>
        )}
        {article.view_count > 0 && (
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {article.view_count.toLocaleString()}
          </span>
        )}
        <Link
          href={`/articles/${article.slug}?lang=${lang}`}
          className="ml-auto text-xs font-medium hover:opacity-70 transition-opacity"
          style={{ color: '#D4830A' }}
        >
          {lang === 'zh' ? '阅读全文 →' : 'Read more →'}
        </Link>
      </div>
    </article>
  )
}

export default function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const lang = (searchParams.get('lang') === 'en' ? 'en' : 'zh') as Lang
  const initialQ = searchParams.get('q') ?? ''

  const [query, setQuery] = useState(initialQ)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([])
        setSearched(false)
        return
      }
      setLoading(true)
      setSearched(true)
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q.trim())}&limit=20`
        )
        const data = await res.json()
        setResults(data.results ?? [])
      } catch {
        setResults([])
      }
      setLoading(false)
    },
    []
  )

  useEffect(() => {
    if (initialQ) search(initialQ)
  }, [initialQ, search])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.replace(`/search?q=${encodeURIComponent(query)}&lang=${lang}`)
    search(query)
  }

  return (
    <>
      <Header lang={lang} />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#1A1A1A' }}>
          {lang === 'zh' ? '搜索文章' : 'Search Articles'}
        </h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl border"
            style={{ borderColor: '#E5E3DF', backgroundColor: '#FFFFFF' }}
          >
            <SearchIcon size={18} style={{ color: '#9CA3AF' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === 'zh' ? '输入关键词搜索…' : 'Search by keyword…'}
              className="flex-1 outline-none text-sm bg-transparent"
              style={{ color: '#1A1A1A' }}
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#D4830A' }}
            >
              {lang === 'zh' ? '搜索' : 'Search'}
            </button>
          </div>
        </form>

        {loading && (
          <p className="text-sm text-center" style={{ color: '#9CA3AF' }}>
            {lang === 'zh' ? '搜索中…' : 'Searching…'}
          </p>
        )}

        {!loading && searched && results.length === 0 && (
          <p className="text-sm text-center py-16" style={{ color: '#9CA3AF' }}>
            {lang === 'zh'
              ? `没有找到与"${query}"相关的文章`
              : `No articles found for "${query}"`}
          </p>
        )}

        {results.length > 0 && (
          <>
            <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
              {lang === 'zh'
                ? `找到 ${results.length} 篇相关文章`
                : `Found ${results.length} article${results.length !== 1 ? 's' : ''}`}
            </p>
            <div className="space-y-4">
              {results.map((result) => (
                <SearchResultCard
                  key={result.article.id}
                  result={result}
                  lang={lang}
                  query={query}
                />
              ))}
            </div>
          </>
        )}
      </main>
      <Footer lang={lang} />
    </>
  )
}
