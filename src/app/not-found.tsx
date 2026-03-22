import Link from 'next/link'
import { getFeaturedArticles } from '@/lib/articles'
import { getTitle } from '@/lib/articles'

export default async function NotFound() {
  let popularArticles: Awaited<ReturnType<typeof getFeaturedArticles>> = []
  try {
    popularArticles = await getFeaturedArticles(3)
  } catch {
    // silently fail — not-found page should always render
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 min-h-[70vh] space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3">
        <p className="text-7xl font-bold text-[#D4830A]">404</p>
        <h1 className="text-2xl font-semibold text-[#1A1A1A] dark:text-[#E5E3DF]">
          页面不存在 / Page Not Found
        </h1>
        <p className="text-[#6B6B6B] dark:text-[#9B9B9B] text-sm max-w-sm mx-auto">
          你访问的页面已被删除或从未存在。The page you are looking for could not be found.
        </p>
      </div>

      {/* Search bar */}
      <form
        action="/search"
        method="get"
        className="w-full max-w-md flex gap-2"
      >
        <input
          type="search"
          name="q"
          placeholder="搜索文章… / Search articles…"
          className="flex-1 px-4 py-2 rounded-md border border-[#D4D4D0] dark:border-[#3A3A3A] bg-white dark:bg-[#252525] text-[#1A1A1A] dark:text-[#E5E3DF] placeholder-[#9B9B9B] text-sm focus:outline-none focus:border-[#D4830A] transition-colors"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-[#D4830A] text-white rounded-md text-sm font-medium hover:bg-[#B8700A] transition-colors"
        >
          搜索
        </button>
      </form>

      {/* Popular articles */}
      {popularArticles.length > 0 && (
        <div className="w-full max-w-md space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-[#9B9B9B]">
            热门文章 / Popular Articles
          </p>
          <ul className="space-y-2">
            {popularArticles.map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/articles/${article.slug}`}
                  className="flex items-center gap-2 text-sm text-[#1A1A1A] dark:text-[#E5E3DF] hover:text-[#D4830A] dark:hover:text-[#D4830A] transition-colors group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4D4D0] dark:bg-[#3A3A3A] group-hover:bg-[#D4830A] transition-colors shrink-0" />
                  {getTitle(article, 'zh')}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Nav links */}
      <div className="flex gap-4">
        <Link
          href="/"
          className="px-5 py-2 bg-[#D4830A] text-white rounded-md text-sm font-medium hover:bg-[#B8700A] transition-colors"
        >
          返回首页 / Home
        </Link>
        <Link
          href="/articles"
          className="px-5 py-2 border border-[#D4D4D0] dark:border-[#3A3A3A] text-[#1A1A1A] dark:text-[#E5E3DF] rounded-md text-sm font-medium hover:border-[#D4830A] dark:hover:border-[#D4830A] transition-colors"
        >
          所有文章 / Articles
        </Link>
      </div>
    </div>
  )
}
