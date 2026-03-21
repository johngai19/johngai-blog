import { Suspense } from 'react'
import SearchContent from './SearchContent'

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-sm" style={{ color: '#9CA3AF' }}>
          加载中…
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}
