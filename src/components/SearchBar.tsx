'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import type { Article, Lang } from '@/types'
import { CATEGORY_LABELS } from '@/types'

interface SearchResult {
  article: Article
  snippet: string
}

interface SearchBarProps {
  lang?: Lang
}

export default function SearchBar({ lang = 'zh' }: SearchBarProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}&limit=5`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    }
    setLoading(false)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setOpen(true)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(() => {
      fetchResults(val)
    }, 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      setOpen(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}&lang=${lang}`)
    }
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  const showDropdown = open && query.trim().length > 0

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div
        className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 transition-colors bg-white dark:bg-[#2A2A2A] ${
          open ? 'border-[#D4830A]' : 'border-[#E5E3DF] dark:border-[#333333]'
        }`}
        style={{ minWidth: '180px' }}
      >
        <Search size={14} className="text-[#9CA3AF] flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.trim() && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={lang === 'zh' ? '搜索文章…' : 'Search…'}
          className="flex-1 outline-none text-xs bg-transparent w-full text-[#1A1A1A] dark:text-[#E5E3DF] placeholder:text-[#9CA3AF] dark:placeholder:text-[#555555]"
          aria-label={lang === 'zh' ? '搜索' : 'Search'}
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
        />
        {query && (
          <button
            onClick={handleClear}
            className="flex-shrink-0 hover:opacity-60 transition-opacity"
            aria-label="Clear search"
            type="button"
          >
            <X size={12} className="text-[#9CA3AF]" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg overflow-hidden z-50 border-[#E5E3DF] dark:border-[#333333] bg-white dark:bg-[#242424]"
          style={{ minWidth: '280px' }}
          role="listbox"
        >
          {loading ? (
            <div className="px-4 py-3 text-xs text-[#9CA3AF]">
              {lang === 'zh' ? '搜索中…' : 'Searching…'}
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-xs text-[#9CA3AF]">
              {lang === 'zh' ? '未找到相关文章' : 'No results found'}
            </div>
          ) : (
            <>
              <ul>
                {results.map(({ article }) => {
                  const title =
                    lang === 'zh'
                      ? article.title_zh || article.title_en || 'Untitled'
                      : article.title_en || article.title_zh || 'Untitled'
                  const categoryInfo = article.category ? CATEGORY_LABELS[article.category] : null
                  const categoryLabel = categoryInfo
                    ? lang === 'zh'
                      ? categoryInfo.zh
                      : categoryInfo.en
                    : article.category

                  return (
                    <li key={article.id} role="option">
                      <Link
                        href={`/articles/${article.slug}?lang=${lang}`}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate leading-snug text-[#1A1A1A] dark:text-[#E5E3DF]">
                            {title}
                          </p>
                          {categoryLabel && (
                            <p className="text-xs mt-0.5 text-[#9CA3AF]">
                              {categoryLabel}
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>

              {/* Footer: link to full search page */}
              <div className="border-t px-4 py-2.5 border-[#F0EDEA] dark:border-[#333333]">
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}&lang=${lang}`}
                  className="flex items-center gap-1.5 text-xs font-medium hover:opacity-70 transition-opacity"
                  style={{ color: '#D4830A' }}
                  onClick={() => setOpen(false)}
                >
                  <Search size={12} />
                  {lang === 'zh'
                    ? `查看全部"${query}"的搜索结果`
                    : `See all results for "${query}"`}
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
