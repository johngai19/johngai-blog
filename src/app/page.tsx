import { Suspense } from 'react'
import Link from 'next/link'
import { getFeaturedArticles, getCategories } from '@/lib/articles'
import ArticleCard from '@/components/ArticleCard'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SubscribeForm from '@/components/SubscribeForm'
import { CATEGORY_LABELS } from '@/types'
import { ArrowRight } from 'lucide-react'

export const revalidate = 3600

interface HomeProps {
  searchParams: Promise<{ lang?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams
  const lang = (params.lang === 'en' ? 'en' : 'zh') as 'zh' | 'en'

  const [featuredArticles, categories] = await Promise.all([
    getFeaturedArticles(3),
    getCategories(),
  ])

  return (
    <>
      <Header lang={lang} />

      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="border-b"
          style={{ borderColor: '#E5E3DF' }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
            <div className="max-w-2xl">
              <div
                className="inline-block text-xs font-medium tracking-widest uppercase mb-6 px-3 py-1 rounded-full"
                style={{ backgroundColor: '#F5E6C8', color: '#D4830A' }}
              >
                {lang === 'zh' ? '个人博客' : 'Personal Blog'}
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight mb-4" style={{ color: '#1A1A1A' }}>
                {lang === 'zh' ? (
                  <>
                    技术与生活，
                    <br />
                    <span style={{ color: '#D4830A' }}>思考的痕迹。</span>
                  </>
                ) : (
                  <>
                    Tech & Life,
                    <br />
                    <span style={{ color: '#D4830A' }}>A trace of thought.</span>
                  </>
                )}
              </h1>
              <p className="text-lg mb-8 leading-relaxed" style={{ color: '#6B7280' }}>
                {lang === 'zh'
                  ? 'John Wei 的个人写作空间。记录技术探索、生活观察与随想感悟，中英双语。'
                  : "John Wei's personal writing space. Notes on technology, life observations, and passing thoughts — in Chinese and English."}
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href={`/articles?lang=${lang}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#D4830A' }}
                >
                  {lang === 'zh' ? '浏览文章' : 'Browse Articles'}
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href={`/subscribe?lang=${lang}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border transition-colors hover:bg-gray-50"
                  style={{ borderColor: '#E5E3DF', color: '#1A1A1A' }}
                >
                  {lang === 'zh' ? '订阅更新' : 'Subscribe'}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Categories bar */}
        {categories.length > 0 && (
          <section
            className="border-b"
            style={{ borderColor: '#E5E3DF', backgroundColor: '#FFFFFF' }}
          >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <Link
                  href={`/articles?lang=${lang}`}
                  className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
                  style={{ borderColor: '#D4830A', color: '#D4830A', backgroundColor: '#F5E6C8' }}
                >
                  {lang === 'zh' ? '全部' : 'All'}
                </Link>
                {categories.map((cat) => {
                  const info = CATEGORY_LABELS[cat]
                  const label = info ? (lang === 'zh' ? info.zh : info.en) : cat
                  return (
                    <Link
                      key={cat}
                      href={`/articles?lang=${lang}&category=${cat}`}
                      className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:bg-gray-50"
                      style={{ borderColor: '#E5E3DF', color: '#6B7280' }}
                    >
                      {label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* Featured articles */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>
              {lang === 'zh' ? '精选文章' : 'Featured Articles'}
            </h2>
            <Link
              href={`/articles?lang=${lang}`}
              className="text-sm flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{ color: '#D4830A' }}
            >
              {lang === 'zh' ? '查看全部' : 'View all'}
              <ArrowRight size={14} />
            </Link>
          </div>

          {featuredArticles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} lang={lang} featured />
              ))}
            </div>
          ) : (
            <div
              className="text-center py-16 rounded-xl border"
              style={{ borderColor: '#E5E3DF', color: '#9CA3AF' }}
            >
              <p>{lang === 'zh' ? '暂无文章' : 'No articles yet'}</p>
            </div>
          )}
        </section>

        {/* Subscribe CTA */}
        <section
          className="border-t border-b"
          style={{ borderColor: '#E5E3DF', backgroundColor: '#FFFFFF' }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
            <div className="max-w-lg mx-auto text-center">
              <h2 className="text-2xl font-semibold mb-3" style={{ color: '#1A1A1A' }}>
                {lang === 'zh' ? '订阅最新文章' : 'Stay in the loop'}
              </h2>
              <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
                {lang === 'zh'
                  ? '新文章发布时第一时间通知您，不频繁，不骚扰。'
                  : 'Get notified when new posts are published. Infrequent, no spam.'}
              </p>
              <Suspense fallback={null}>
                <SubscribeForm lang={lang} />
              </Suspense>
            </div>
          </div>
        </section>
      </main>

      <Footer lang={lang} />
    </>
  )
}
