export default function RootLoading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#D4D4D0] dark:border-[#3A3A3A] border-t-[#D4830A] rounded-full animate-spin" />
        <p className="text-sm text-[#6B6B6B] dark:text-[#9B9B9B]">加载中…</p>
      </div>
    </div>
  )
}
