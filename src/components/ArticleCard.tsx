import Link from 'next/link'
import Image from 'next/image'
import type { Article, Lang } from '@/types'
import { CATEGORY_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'
import { Clock, Eye } from 'lucide-react'

interface ArticleCardProps {
  article: Article
  lang: Lang
  featured?: boolean
}

export default function ArticleCard({ article, lang, featured = false }: ArticleCardProps) {
  const title =
    lang === 'zh'
      ? article.title_zh || article.title_en || 'Untitled'
      : article.title_en || article.title_zh || 'Untitled'

  const excerpt =
    lang === 'zh'
      ? article.excerpt_zh || article.excerpt_en || ''
      : article.excerpt_en || article.excerpt_zh || ''

  const categoryInfo = article.category ? CATEGORY_LABELS[article.category] : null
  const categoryLabel = categoryInfo
    ? lang === 'zh'
      ? categoryInfo.zh
      : categoryInfo.en
    : article.category

  return (
    <article
      className="group rounded-xl overflow-hidden border transition-shadow hover:shadow-md"
      style={{
        borderColor: '#E5E3DF',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Cover image */}
      {article.cover_image && (
        <Link href={`/articles/${article.slug}?lang=${lang}`}>
          <div className={`relative overflow-hidden ${featured ? 'h-52' : 'h-40'} bg-gray-100`}>
            <Image
              src={article.cover_image}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </Link>
      )}

      <div className="p-5">
        {/* Category + date row */}
        <div className="flex items-center justify-between mb-3">
          {categoryLabel && (
            <span
              className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                categoryInfo?.color ?? 'bg-gray-50 text-gray-600'
              }`}
            >
              {categoryLabel}
            </span>
          )}
          <span className="text-xs" style={{ color: '#6B7280' }}>
            {formatDate(article.published_at, lang)}
          </span>
        </div>

        {/* Title */}
        <Link href={`/articles/${article.slug}?lang=${lang}`}>
          <h2
            className={`font-semibold leading-snug mb-2 group-hover:opacity-70 transition-opacity ${
              featured ? 'text-lg' : 'text-base'
            } ${lang === 'zh' ? 'font-[var(--font-noto-serif-sc)]' : ''}`}
            style={{ color: '#1A1A1A' }}
          >
            {title}
          </h2>
        </Link>

        {/* Excerpt */}
        {excerpt && (
          <p
            className="text-sm line-clamp-3 mb-4"
            style={{ color: '#6B7280' }}
          >
            {excerpt}
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
        </div>
      </div>
    </article>
  )
}
