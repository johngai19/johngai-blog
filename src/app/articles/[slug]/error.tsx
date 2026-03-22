'use client'

import Link from 'next/link'

export default function ArticleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 min-h-[60vh]">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-[#1A1A1A] dark:text-[#E5E3DF]">
            无法加载文章
          </h2>
          <p className="text-[#6B6B6B] dark:text-[#9B9B9B] text-sm">
            {error.message || '加载文章内容时发生错误，请重试。Failed to load the article.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="px-5 py-2 bg-[#D4830A] text-white rounded-md text-sm font-medium hover:bg-[#B8700A] transition-colors"
          >
            重试 / Retry
          </button>
          <Link
            href="/articles"
            className="px-5 py-2 border border-[#D4D4D0] dark:border-[#3A3A3A] text-[#1A1A1A] dark:text-[#E5E3DF] rounded-md text-sm font-medium hover:border-[#D4830A] dark:hover:border-[#D4830A] transition-colors"
          >
            所有文章 / All Articles
          </Link>
        </div>
      </div>
    </div>
  )
}
