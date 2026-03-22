export default function ArticlesLoading() {
  return (
    <div className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
      {/* Filter bar skeleton */}
      <div className="flex gap-2 mb-8 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 rounded-full bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse"
          />
        ))}
      </div>

      {/* Article card grid — 3 columns × 4 rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl overflow-hidden border border-[#E5E3DF] dark:border-[#2A2A2A] bg-white dark:bg-[#252525]"
          >
            {/* Cover image placeholder */}
            <div className="h-44 bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse" />

            <div className="p-4 space-y-3">
              {/* Category tag */}
              <div className="h-4 w-16 rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse" />
              {/* Title */}
              <div className="space-y-1.5">
                <div className="h-5 w-full rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse" />
                <div className="h-5 w-3/4 rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse" />
              </div>
              {/* Excerpt */}
              <div className="space-y-1">
                <div className="h-3.5 w-full rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse" />
                <div className="h-3.5 w-5/6 rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse" />
              </div>
              {/* Meta */}
              <div className="flex gap-2 pt-1">
                <div className="h-3.5 w-20 rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse" />
                <div className="h-3.5 w-14 rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
