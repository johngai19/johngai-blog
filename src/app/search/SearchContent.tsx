'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search as SearchIcon } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ArticleCard from '@/components/ArticleCard'
import type { Article, Lang } from '@/types'

export default function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const lang = (searchParams.get('lang') === 'en' ? 'en' : 'zh') as Lang
  const initialQ = searchParams.get('q') ?? ''

  const [query, setQuery] = useState(initialQ)
  const [results, setResults] = useState<Article[]>([])
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
          `/api/articles?pageSize=50&lang=${lang}&search=${encodeURIComponent(q.trim())}`
        )
        const data = await res.json()
        setResults(data.articles ?? [])
      } catch {
        setResults([])
      }
      setLoading(false)
    },
    [lang]
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
              placeholder={
                lang === 'zh' ? '输入关键词搜索…' : 'Search by keyword…'
              }
              className="flex-1 outline-none text-sm"
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
          <p className="text-sm text-center" style={{ color: '#9CA3AF' }}>
            {lang === 'zh'
              ? `没有找到与"${query}"相关的文章`
              : `No articles found for "${query}"`}
          </p>
        )}

        {results.length > 0 && (
          <>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
              {lang === 'zh'
                ? `找到 ${results.length} 篇相关文章`
                : `Found ${results.length} articles`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((article) => (
                <ArticleCard key={article.id} article={article} lang={lang} />
              ))}
            </div>
          </>
        )}
      </main>
      <Footer lang={lang} />
    </>
  )
}
