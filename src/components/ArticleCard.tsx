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
    <article className="group rounded-xl overflow-hidden border border-[#E5E3DF] dark:border-[#333333] bg-white dark:bg-[#242424] transition-shadow hover:shadow-md dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
      {/* Cover image or category gradient */}
      <Link href={`/articles/${article.slug}?lang=${lang}`}>
        <div className={`relative overflow-hidden ${featured ? 'h-52' : 'h-32'} ${article.cover_image ? 'bg-gray-100 dark:bg-[#2A2A2A]' : ''}`}>
          {article.cover_image ? (
            <Image
              src={article.cover_image}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${
              article.category === 'engineering' ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 dark:from-blue-900/40 dark:to-cyan-900/40' :
              article.category === 'life' ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 dark:from-green-900/40 dark:to-emerald-900/40' :
              article.category === 'books' ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/20 dark:from-purple-900/40 dark:to-violet-900/40' :
              article.category === 'industry' ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/20 dark:from-orange-900/40 dark:to-amber-900/40' :
              article.category === 'startup' ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20 dark:from-red-900/40 dark:to-rose-900/40' :
              'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 dark:from-amber-900/40 dark:to-yellow-900/40'
            }`}>
              <span className="text-3xl opacity-30">
                {article.category === 'engineering' ? '⚙️' :
                 article.category === 'life' ? '🌿' :
                 article.category === 'books' ? '📚' :
                 article.category === 'industry' ? '🏭' :
                 article.category === 'startup' ? '🚀' : '✍️'}
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-5">
        {/* Category + date row */}
        <div className="flex items-center justify-between mb-3">
          {categoryLabel && (
            <span
              className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                categoryInfo?.color ?? 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {categoryLabel}
            </span>
          )}
          <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            {formatDate(article.published_at, lang)}
          </span>
        </div>

        {/* Title */}
        <Link href={`/articles/${article.slug}?lang=${lang}`}>
          <h2
            className={`font-semibold leading-snug mb-2 group-hover:opacity-70 transition-opacity text-[#1A1A1A] dark:text-[#E5E3DF] ${
              featured ? 'text-lg' : 'text-base'
            } ${lang === 'zh' ? 'font-[var(--font-noto-serif-sc)]' : ''}`}
          >
            {title}
          </h2>
        </Link>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-sm line-clamp-3 mb-4 text-[#6B7280] dark:text-[#9CA3AF]">
            {excerpt}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-[#9CA3AF] dark:text-[#6B7280]">
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
