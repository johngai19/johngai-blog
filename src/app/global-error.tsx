'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="zh">
      <body className="antialiased min-h-screen flex flex-col bg-[#FAFAF8] text-[#1A1A1A] dark:bg-[#1A1A1A] dark:text-[#E5E3DF]">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-5xl font-bold text-[#D4830A]">500</h1>
              <h2 className="text-2xl font-semibold text-[#1A1A1A] dark:text-[#E5E3DF]">
                系统错误 / System Error
              </h2>
              <p className="text-[#6B6B6B] dark:text-[#9B9B9B] text-sm">
                {error.message || '发生了意外错误，请稍后重试。Something unexpected happened.'}
              </p>
            </div>

            <button
              onClick={reset}
              className="inline-block px-6 py-2.5 bg-[#D4830A] text-white rounded-md text-sm font-medium hover:bg-[#B8700A] transition-colors"
            >
              重试 / Retry
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
