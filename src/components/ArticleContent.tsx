'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import type { Article, Lang } from '@/types'

interface TocItem {
  id: string
  text: string
  level: number
}

function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split('\n')
  const toc: TocItem[] = []
  for (const line of lines) {
    const match = line.match(/^(#{1,4})\s+(.+)/)
    if (match) {
      const level = match[1].length
      const text = match[2].replace(/[*_`]/g, '')
      const id = text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u4e00-\u9fa5-]/g, '')
      toc.push({ id, text, level })
    }
  }
  return toc
}

interface ArticleContentProps {
  article: Article
  initialLang: Lang
}

export default function ArticleContent({ article, initialLang }: ArticleContentProps) {
  const [contentLang, setContentLang] = useState<Lang>(initialLang)
  const [activeId, setActiveId] = useState<string>('')
  const [mobileTocOpen, setMobileTocOpen] = useState(false)

  const zhContent = article.content_zh || ''
  const enContent = article.content_en || ''
  const hasBoth = zhContent.length > 0 && enContent.length > 0

  const currentContent = contentLang === 'zh' ? zhContent || enContent : enContent || zhContent
  const toc = extractToc(currentContent)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px' }
    )

    const headings = document.querySelectorAll('.prose h1, .prose h2, .prose h3, .prose h4')
    headings.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [currentContent])

  // Close mobile TOC on escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileTocOpen(false)
    }
    if (mobileTocOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [mobileTocOpen])

  const tocNav = (
    <nav className="space-y-1">
      {toc.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          onClick={() => setMobileTocOpen(false)}
          className="block text-xs leading-relaxed transition-colors truncate"
          style={{
            paddingLeft: `${(item.level - 1) * 12}px`,
            color: activeId === item.id ? '#D4830A' : '#9CA3AF',
            fontWeight: activeId === item.id ? '500' : '400',
          }}
        >
          {item.text}
        </a>
      ))}
    </nav>
  )

  return (
    <div className="flex gap-10">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Language tab toggle */}
        {hasBoth && (
          <div className="flex gap-1 p-1 rounded-lg border mb-8 w-fit border-[#E5E3DF] dark:border-[#333333] bg-[#F3F0EB] dark:bg-[#2A2A2A]">
            {(['zh', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setContentLang(l)}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                style={{
                  backgroundColor: contentLang === l ? (document.documentElement.classList.contains('dark') ? '#1A1A1A' : '#FFFFFF') : 'transparent',
                  color: contentLang === l ? (document.documentElement.classList.contains('dark') ? '#E5E3DF' : '#1A1A1A') : '#6B7280',
                  boxShadow: contentLang === l ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {l === 'zh' ? '中文' : 'English'}
              </button>
            ))}
          </div>
        )}

        {/* Article body */}
        <div className={`prose max-w-none ${contentLang === 'zh' ? 'prose-zh' : ''}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            components={{
              h1: ({ children, ...props }) => {
                const text = String(children)
                const id = text
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^\w\u4e00-\u9fa5-]/g, '')
                return <h1 id={id} {...props}>{children}</h1>
              },
              h2: ({ children, ...props }) => {
                const text = String(children)
                const id = text
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^\w\u4e00-\u9fa5-]/g, '')
                return <h2 id={id} {...props}>{children}</h2>
              },
              h3: ({ children, ...props }) => {
                const text = String(children)
                const id = text
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^\w\u4e00-\u9fa5-]/g, '')
                return <h3 id={id} {...props}>{children}</h3>
              },
              h4: ({ children, ...props }) => {
                const text = String(children)
                const id = text
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^\w\u4e00-\u9fa5-]/g, '')
                return <h4 id={id} {...props}>{children}</h4>
              },
            }}
          >
            {currentContent}
          </ReactMarkdown>
        </div>
      </div>

      {/* Desktop TOC Sidebar */}
      {toc.length > 2 && (
        <aside className="hidden xl:block w-56 flex-shrink-0">
          <div className="sticky top-20">
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-3 text-[#9CA3AF] dark:text-[#6B7280]">
              {contentLang === 'zh' ? '目录' : 'Contents'}
            </h3>
            {tocNav}
          </div>
        </aside>
      )}

      {/* Mobile TOC floating button (visible below xl) */}
      {toc.length > 2 && (
        <>
          <button
            onClick={() => setMobileTocOpen(true)}
            className="xl:hidden fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
            style={{ backgroundColor: '#D4830A', color: '#FFFFFF' }}
            aria-label={contentLang === 'zh' ? '目录' : 'Table of contents'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>

          {/* Mobile TOC slide-up panel */}
          {mobileTocOpen && (
            <div className="xl:hidden fixed inset-0 z-50">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/30 dark:bg-black/50"
                onClick={() => setMobileTocOpen(false)}
              />
              {/* Panel */}
              <div className="absolute bottom-0 left-0 right-0 max-h-[60vh] rounded-t-2xl overflow-y-auto p-6 animate-slide-up bg-white dark:bg-[#242424]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E3DF]">
                    {contentLang === 'zh' ? '目录' : 'Contents'}
                  </h3>
                  <button
                    onClick={() => setMobileTocOpen(false)}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#333333] transition-colors text-[#6B7280]"
                    aria-label="Close"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                {tocNav}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
