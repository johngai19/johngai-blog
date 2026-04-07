import { Suspense } from 'react'
import SearchContent from './SearchContent'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search - John\'s Blog',
  description: 'Search articles on johngai.com by keyword, category, or topic.',
  alternates: {
    canonical: 'https://www.johngai.com/search',
  },
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-sm text-gray-400 dark:text-gray-500">
          Loading...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}
