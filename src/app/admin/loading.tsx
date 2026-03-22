export default function AdminLoading() {
  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full space-y-6">
      {/* Page title */}
      <div className="h-8 w-40 rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse" />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#E5E3DF] dark:border-[#2A2A2A] p-4 space-y-2"
          >
            <div className="h-4 w-20 rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse" />
            <div className="h-7 w-12 rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table header */}
      <div className="rounded-xl border border-[#E5E3DF] dark:border-[#2A2A2A] overflow-hidden">
        <div className="flex gap-4 px-4 py-3 border-b border-[#E5E3DF] dark:border-[#2A2A2A]">
          {[40, 20, 15, 15].map((w, i) => (
            <div
              key={i}
              className={`h-4 rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse`}
              style={{ width: `${w}%` }}
            />
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, row) => (
          <div
            key={row}
            className="flex gap-4 px-4 py-3 border-b last:border-0 border-[#E5E3DF] dark:border-[#2A2A2A]"
          >
            {[40, 20, 15, 15].map((w, col) => (
              <div
                key={col}
                className="h-4 rounded bg-[#E5E3DF] dark:bg-[#2A2A2A] animate-pulse"
                style={{ width: `${w}%`, opacity: 0.6 + (row % 3) * 0.1 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
