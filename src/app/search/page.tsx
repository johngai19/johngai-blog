import { Suspense } from 'react'
import SearchContent from './SearchContent'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search articles on johngai.com',
}

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
