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

  return (
    <div className="flex gap-10">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Language tab toggle */}
        {hasBoth && (
          <div
            className="flex gap-1 p-1 rounded-lg border mb-8 w-fit"
            style={{ borderColor: '#E5E3DF', backgroundColor: '#F3F0EB' }}
          >
            {(['zh', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setContentLang(l)}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                style={{
                  backgroundColor: contentLang === l ? '#FFFFFF' : 'transparent',
                  color: contentLang === l ? '#1A1A1A' : '#6B7280',
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

      {/* TOC Sidebar */}
      {toc.length > 2 && (
        <aside className="hidden xl:block w-56 flex-shrink-0">
          <div className="sticky top-20">
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#9CA3AF' }}>
              {contentLang === 'zh' ? '目录' : 'Contents'}
            </h3>
            <nav className="space-y-1">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
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
          </div>
        </aside>
      )}
    </div>
  )
}
