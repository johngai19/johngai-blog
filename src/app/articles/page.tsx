import { Suspense } from 'react'
import Link from 'next/link'
import { getArticles, getCategories } from '@/lib/articles'
import ArticleCard from '@/components/ArticleCard'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { CATEGORY_LABELS } from '@/types'
import type { Metadata } from 'next'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Articles',
  description: 'All articles by John Wei',
}

interface ArticlesPageProps {
  searchParams: Promise<{
    lang?: string
    category?: string
    page?: string
  }>
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams
  const lang = (params.lang === 'en' ? 'en' : 'zh') as 'zh' | 'en'
  const category = params.category
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const pageSize = 12

  const [{ articles, total, totalPages }, categories] = await Promise.all([
    getArticles({ page, pageSize, category, lang }),
    getCategories(),
  ])

  return (
    <>
      <Header lang={lang} />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          {/* Page title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ color: '#1A1A1A' }}>
              {lang === 'zh' ? '所有文章' : 'All Articles'}
            </h1>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              {total} {lang === 'zh' ? '篇' : 'posts'}
            </p>
          </div>

          {/* Filters: Language + Category */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {/* Language toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
                {lang === 'zh' ? '语言：' : 'Language:'}
              </span>
              <div
                className="flex rounded-lg border overflow-hidden"
                style={{ borderColor: '#E5E3DF' }}
              >
                {(['zh', 'en'] as const).map((l) => (
                  <Link
                    key={l}
                    href={`/articles?lang=${l}${category ? `&category=${category}` : ''}`}
                    className="px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: lang === l ? '#D4830A' : '#FFFFFF',
                      color: lang === l ? '#FFFFFF' : '#6B7280',
                    }}
                  >
                    {l === 'zh' ? '中文' : 'English'}
                  </Link>
                ))}
              </div>
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
                {lang === 'zh' ? '分类：' : 'Category:'}
              </span>
              <Link
                href={`/articles?lang=${lang}`}
                className="text-xs px-3 py-1.5 rounded-full border transition-colors"
                style={{
                  borderColor: !category ? '#D4830A' : '#E5E3DF',
                  backgroundColor: !category ? '#F5E6C8' : '#FFFFFF',
                  color: !category ? '#D4830A' : '#6B7280',
                }}
              >
                {lang === 'zh' ? '全部' : 'All'}
              </Link>
              {categories.map((cat) => {
                const info = CATEGORY_LABELS[cat]
                const label = info ? (lang === 'zh' ? info.zh : info.en) : cat
                const isActive = category === cat
                return (
                  <Link
                    key={cat}
                    href={`/articles?lang=${lang}&category=${cat}`}
                    className="text-xs px-3 py-1.5 rounded-full border transition-colors"
                    style={{
                      borderColor: isActive ? '#D4830A' : '#E5E3DF',
                      backgroundColor: isActive ? '#F5E6C8' : '#FFFFFF',
                      color: isActive ? '#D4830A' : '#6B7280',
                    }}
                  >
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Articles grid */}
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} lang={lang} />
              ))}
            </div>
          ) : (
            <div
              className="text-center py-20 rounded-xl border"
              style={{ borderColor: '#E5E3DF', color: '#9CA3AF' }}
            >
              <p className="text-lg mb-2">
                {lang === 'zh' ? '暂无文章' : 'No articles found'}
              </p>
              <p className="text-sm">
                {lang === 'zh' ? '换个分类试试？' : 'Try a different category?'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {page > 1 && (
                <Link
                  href={`/articles?lang=${lang}${category ? `&category=${category}` : ''}&page=${page - 1}`}
                  className="px-4 py-2 rounded-lg border text-sm transition-colors hover:bg-gray-50"
                  style={{ borderColor: '#E5E3DF', color: '#1A1A1A' }}
                >
                  {lang === 'zh' ? '上一页' : 'Previous'}
                </Link>
              )}

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 7) {
                    pageNum = i + 1
                  } else if (page <= 4) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i
                  } else {
                    pageNum = page - 3 + i
                  }
                  const isActive = pageNum === page
                  return (
                    <Link
                      key={pageNum}
                      href={`/articles?lang=${lang}${category ? `&category=${category}` : ''}&page=${pageNum}`}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: isActive ? '#D4830A' : '#FFFFFF',
                        color: isActive ? '#FFFFFF' : '#6B7280',
                        border: isActive ? 'none' : '1px solid #E5E3DF',
                      }}
                    >
                      {pageNum}
                    </Link>
                  )
                })}
              </div>

              {page < totalPages && (
                <Link
                  href={`/articles?lang=${lang}${category ? `&category=${category}` : ''}&page=${page + 1}`}
                  className="px-4 py-2 rounded-lg border text-sm transition-colors hover:bg-gray-50"
                  style={{ borderColor: '#E5E3DF', color: '#1A1A1A' }}
                >
                  {lang === 'zh' ? '下一页' : 'Next'}
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer lang={lang} />
    </>
  )
}
