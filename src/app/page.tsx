import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getLatestArticles, getArticlesByCategory, getCategories, getTitle, getExcerpt } from '@/lib/articles'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SubscribeForm from '@/components/SubscribeForm'
import { CATEGORY_LABELS } from '@/types'
import type { Metadata } from 'next'
import type { Article, Lang } from '@/types'
import { ArrowRight, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const revalidate = 3600

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.johngai.com',
  },
}

const CATEGORY_GRADIENT: Record<string, string> = {
  engineering: 'from-blue-500/20 to-cyan-500/20 dark:from-blue-900/40 dark:to-cyan-900/40',
  life: 'from-green-500/20 to-emerald-500/20 dark:from-green-900/40 dark:to-emerald-900/40',
  books: 'from-purple-500/20 to-violet-500/20 dark:from-purple-900/40 dark:to-violet-900/40',
  industry: 'from-orange-500/20 to-amber-500/20 dark:from-orange-900/40 dark:to-amber-900/40',
  startup: 'from-red-500/20 to-rose-500/20 dark:from-red-900/40 dark:to-rose-900/40',
  writing: 'from-amber-500/20 to-yellow-500/20 dark:from-amber-900/40 dark:to-yellow-900/40',
}

const CATEGORY_DOT: Record<string, string> = {
  engineering: 'bg-blue-500',
  life: 'bg-green-500',
  books: 'bg-purple-500',
  industry: 'bg-orange-500',
  startup: 'bg-red-500',
  writing: 'bg-amber-500',
}

const BROWSE_CATEGORIES = ['engineering', 'life', 'books', 'industry', 'startup'] as const

interface HomeProps {
  searchParams: Promise<{ lang?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams
  const lang = (params.lang === 'zh' ? 'zh' : 'en') as Lang

  const [latestArticles, categories] = await Promise.all([
    getLatestArticles(6),
    getCategories(),
  ])

  // Fetch 2 articles per browseable category in parallel
  const categoryArticles: Record<string, Article[]> = {}
  const categoryResults = await Promise.all(
    BROWSE_CATEGORIES.map((cat) => getArticlesByCategory(cat, 2))
  )
  BROWSE_CATEGORIES.forEach((cat, i) => {
    categoryArticles[cat] = categoryResults[i]
  })

  const heroArticle = latestArticles[0]
  const restArticles = latestArticles.slice(1)

  return (
    <>
      <Header lang={lang} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-3 text-gray-900 dark:text-gray-100">
                {lang === 'zh' ? (
                  <>
                    技术与生活，
                    <span className="text-amber-600 dark:text-amber-400">思考的痕迹。</span>
                  </>
                ) : (
                  <>
                    Tech & Life,{' '}
                    <span className="text-amber-600 dark:text-amber-400">A trace of thought.</span>
                  </>
                )}
              </h1>
              <p className="text-base mb-6 leading-relaxed text-gray-500 dark:text-gray-400">
                {lang === 'zh'
                  ? 'John Wei 的个人写作空间。记录技术探索、生活观察与随想感悟。'
                  : "John Wei's personal writing space. Notes on technology, life, and passing thoughts."}
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href={`/articles?lang=${lang}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white bg-amber-600 dark:bg-amber-500 transition-opacity hover:opacity-90"
                >
                  {lang === 'zh' ? '浏览文章' : 'Browse Articles'}
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href={`/subscribe?lang=${lang}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {lang === 'zh' ? '订阅' : 'Subscribe'}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Latest Articles */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {lang === 'zh' ? '最新文章' : 'Latest'}
            </h2>
            <Link
              href={`/articles?lang=${lang}`}
              className="text-sm flex items-center gap-1 text-amber-600 dark:text-amber-400 transition-opacity hover:opacity-70"
            >
              {lang === 'zh' ? '查看全部' : 'View all'}
              <ArrowRight size={14} />
            </Link>
          </div>

          {heroArticle ? (
            <div className="space-y-6">
              {/* Hero article - large card */}
              <HeroArticleCard article={heroArticle} lang={lang} />

              {/* Remaining articles - compact grid */}
              {restArticles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {restArticles.map((article) => (
                    <CompactArticleCard key={article.id} article={article} lang={lang} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500">
              <p>{lang === 'zh' ? '暂无文章' : 'No articles yet'}</p>
            </div>
          )}
        </section>

        {/* Category Browse */}
        {categories.length > 0 && (
          <section className="border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
              <h2 className="text-xl font-semibold mb-8 text-gray-900 dark:text-gray-100">
                {lang === 'zh' ? '分类浏览' : 'Categories'}
              </h2>
              <div className="space-y-6">
                {BROWSE_CATEGORIES.map((cat) => {
                  const articles = categoryArticles[cat]
                  if (!articles || articles.length === 0) return null
                  const info = CATEGORY_LABELS[cat]
                  const label = info ? (lang === 'zh' ? info.zh : info.en) : cat
                  const dotColor = CATEGORY_DOT[cat] ?? 'bg-gray-400'

                  return (
                    <div key={cat} className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <Link
                        href={`/articles?lang=${lang}&category=${cat}`}
                        className="flex items-center gap-2 sm:w-40 flex-shrink-0 group/cat"
                      >
                        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover/cat:text-amber-600 dark:group-hover/cat:text-amber-400 transition-colors">
                          {label}
                        </span>
                        <ArrowRight size={12} className="text-gray-400 dark:text-gray-500" />
                      </Link>
                      <div className="flex-1 flex flex-col sm:flex-row gap-3">
                        {articles.map((a) => {
                          const title = getTitle(a, lang)
                          return (
                            <Link
                              key={a.id}
                              href={`/articles/${a.slug}?lang=${lang}`}
                              className="flex-1 px-4 py-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
                                {title}
                              </p>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {formatDate(a.published_at, lang)}
                              </span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* Subscribe CTA */}
        <section className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
            <div className="max-w-lg mx-auto text-center">
              <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                {lang === 'zh' ? '订阅最新文章' : 'Stay in the loop'}
              </h2>
              <p className="text-sm mb-6 text-gray-500 dark:text-gray-400">
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

/* ─── Sub-components ─── */

function HeroArticleCard({ article, lang }: { article: Article; lang: Lang }) {
  const title = getTitle(article, lang)
  const excerpt = getExcerpt(article, lang)
    .replace(/^#+\s+/gm, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .replace(/\n/g, ' ')
    .trim()
    .slice(0, 200)
  const categoryInfo = article.category ? CATEGORY_LABELS[article.category] : null
  const categoryLabel = categoryInfo ? (lang === 'zh' ? categoryInfo.zh : categoryInfo.en) : article.category
  const gradient = CATEGORY_GRADIENT[article.category ?? ''] ?? CATEGORY_GRADIENT.writing

  return (
    <Link href={`/articles/${article.slug}?lang=${lang}`} className="block group">
      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#242424] transition-shadow hover:shadow-md dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
        {/* Cover or gradient */}
        <div className="relative h-56 sm:h-64 overflow-hidden">
          {article.cover_image ? (
            <Image
              src={article.cover_image}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
              <span className="text-5xl opacity-20">
                {article.category === 'engineering' ? '\u2699\uFE0F' :
                 article.category === 'life' ? '\uD83C\uDF3F' :
                 article.category === 'books' ? '\uD83D\uDCDA' :
                 article.category === 'industry' ? '\uD83C\uDFED' :
                 article.category === 'startup' ? '\uD83D\uDE80' : '\u270D\uFE0F'}
              </span>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            {categoryLabel && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryInfo?.color ?? 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                {categoryLabel}
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatDate(article.published_at, lang)}
            </span>
            {article.reading_time_min && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <Clock size={12} />
                {lang === 'zh' ? `${article.reading_time_min} 分钟` : `${article.reading_time_min} min`}
              </span>
            )}
          </div>
          <h3 className={`text-xl sm:text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:opacity-70 transition-opacity ${lang === 'zh' ? 'font-[var(--font-noto-serif-sc)]' : ''}`}>
            {title}
          </h3>
          {excerpt && (
            <p className="text-sm line-clamp-2 text-gray-500 dark:text-gray-400">
              {excerpt}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

function CompactArticleCard({ article, lang }: { article: Article; lang: Lang }) {
  const title = getTitle(article, lang)
  const categoryInfo = article.category ? CATEGORY_LABELS[article.category] : null
  const categoryLabel = categoryInfo ? (lang === 'zh' ? categoryInfo.zh : categoryInfo.en) : article.category
  const dotColor = CATEGORY_DOT[article.category ?? ''] ?? 'bg-gray-400'

  return (
    <Link
      href={`/articles/${article.slug}?lang=${lang}`}
      className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
    >
      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
      <div className="min-w-0">
        <h4 className={`text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors ${lang === 'zh' ? 'font-[var(--font-noto-serif-sc)]' : ''}`}>
          {title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          {categoryLabel && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{categoryLabel}</span>
          )}
          <span className="text-xs text-gray-300 dark:text-gray-600">|</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatDate(article.published_at, lang)}
          </span>
        </div>
      </div>
    </Link>
  )
}
