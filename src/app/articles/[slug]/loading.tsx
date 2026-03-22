export default function ArticleDetailLoading() {
  return (
    <div className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
      <div className="flex gap-10">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Category + date */}
          <div className="flex gap-3 items-center">
            <div className="h-5 w-20 rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse" />
            <div className="h-4 w-24 rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse" />
          </div>

          {/* Title bar */}
          <div className="space-y-2">
            <div className="h-9 w-full rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse" />
            <div className="h-9 w-4/5 rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse" />
          </div>

          {/* Cover image */}
          <div className="h-64 w-full rounded-xl bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse" />

          {/* Content block */}
          <div className="space-y-3 pt-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={`h-4 rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse ${
                  i % 5 === 4 ? 'w-2/3' : i % 3 === 2 ? 'w-5/6' : 'w-full'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 space-y-4">
          <div className="h-5 w-24 rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`h-4 rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse ${
                i % 2 === 0 ? 'w-full' : 'w-3/4'
              }`}
            />
          ))}
        </aside>
      </div>
    </div>
  )
}
