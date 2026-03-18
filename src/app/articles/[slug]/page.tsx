import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getArticle, getRelatedArticles } from '@/lib/articles'
import { CATEGORY_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ArticleCard from '@/components/ArticleCard'
import ArticleContent from '@/components/ArticleContent'
import SubscribeForm from '@/components/SubscribeForm'
import { Clock, Eye, ArrowLeft, Calendar } from 'lucide-react'

export const revalidate = 600

interface ArticlePageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lang?: string }>
}

export async function generateMetadata({ params, searchParams }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const sp = await searchParams
  const lang = (sp.lang === 'en' ? 'en' : 'zh') as 'zh' | 'en'
  const article = await getArticle(slug)

  if (!article) return { title: 'Article Not Found' }

  const title = lang === 'zh'
    ? article.title_zh || article.title_en || 'Untitled'
    : article.title_en || article.title_zh || 'Untitled'

  const excerpt = lang === 'zh'
    ? article.excerpt_zh || article.excerpt_en || ''
    : article.excerpt_en || article.excerpt_zh || ''

  return {
    title,
    description: excerpt,
    openGraph: {
      title,
      description: excerpt,
      images: article.cover_image ? [article.cover_image] : [],
    },
  }
}

export default async function ArticlePage({ params, searchParams }: ArticlePageProps) {
  const { slug } = await params
  const sp = await searchParams
  const lang = (sp.lang === 'en' ? 'en' : 'zh') as 'zh' | 'en'

  const article = await getArticle(slug)
  if (!article) notFound()

  const relatedArticles = await getRelatedArticles(slug, article.category, 3)

  const title = lang === 'zh'
    ? article.title_zh || article.title_en || 'Untitled'
    : article.title_en || article.title_zh || 'Untitled'

  const categoryInfo = article.category ? CATEGORY_LABELS[article.category] : null
  const categoryLabel = categoryInfo
    ? lang === 'zh' ? categoryInfo.zh : categoryInfo.en
    : article.category

  return (
    <>
      <Header lang={lang} />
      <main className="flex-1">
        <article className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          {/* Back link */}
          <Link
            href={`/articles?lang=${lang}`}
            className="inline-flex items-center gap-1.5 text-sm mb-8 transition-opacity hover:opacity-60"
            style={{ color: '#6B7280' }}
          >
            <ArrowLeft size={14} />
            {lang === 'zh' ? '返回文章列表' : 'Back to articles'}
          </Link>

          {/* Header */}
          <header className="mb-8">
            {categoryLabel && (
              <div className="mb-3">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    categoryInfo?.color ?? 'bg-gray-50 text-gray-600'
                  }`}
                >
                  {categoryLabel}
                </span>
              </div>
            )}

            <h1
              className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-4"
              style={{ color: '#1A1A1A', fontFamily: lang === 'zh' ? "'Noto Serif SC', serif" : 'inherit' }}
            >
              {title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: '#9CA3AF' }}>
              {article.published_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {formatDate(article.published_at, lang)}
                </span>
              )}
              {article.reading_time_min && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {lang === 'zh' ? `${article.reading_time_min} 分钟阅读` : `${article.reading_time_min} min read`}
                </span>
              )}
              {article.view_count > 0 && (
                <span className="flex items-center gap-1.5">
                  <Eye size={14} />
                  {article.view_count.toLocaleString()} {lang === 'zh' ? '次阅读' : 'views'}
                </span>
              )}
            </div>
          </header>

          {/* Cover image */}
          {article.cover_image && (
            <div className="relative w-full h-64 sm:h-80 mb-10 rounded-xl overflow-hidden">
              <Image
                src={article.cover_image}
                alt={title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 960px"
              />
            </div>
          )}

          {/* Content with TOC */}
          <Suspense fallback={<div className="py-10 text-center" style={{ color: '#9CA3AF' }}>Loading...</div>}>
            <ArticleContent article={article} initialLang={lang} />
          </Suspense>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t flex flex-wrap gap-2" style={{ borderColor: '#E5E3DF' }}>
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full border"
                  style={{ borderColor: '#E5E3DF', color: '#6B7280' }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* Subscribe CTA */}
        <section
          className="border-t border-b"
          style={{ borderColor: '#E5E3DF', backgroundColor: '#FFFFFF' }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            <div className="max-w-md mx-auto text-center">
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                {lang === 'zh' ? '喜欢这篇文章？' : 'Enjoyed this article?'}
              </h3>
              <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
                {lang === 'zh'
                  ? '订阅邮件，新文章发布时第一时间收到通知。'
                  : 'Subscribe to get notified when new posts are published.'}
              </p>
              <Suspense fallback={null}>
                <SubscribeForm lang={lang} />
              </Suspense>
            </div>
          </div>
        </section>

        {/* Related articles */}
        {relatedArticles.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            <h3 className="text-lg font-semibold mb-6" style={{ color: '#1A1A1A' }}>
              {lang === 'zh' ? '相关文章' : 'Related Articles'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedArticles.map((a) => (
                <ArticleCard key={a.id} article={a} lang={lang} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer lang={lang} />
    </>
  )
}
