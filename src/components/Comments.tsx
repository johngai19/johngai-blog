'use client'

import Giscus from '@giscus/react'
import { useEffect, useState } from 'react'

interface CommentsProps {
  slug: string
  lang?: 'zh' | 'en'
}

export default function Comments({ slug, lang = 'zh' }: CommentsProps) {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark_dimmed' : 'light')

    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark_dimmed' : 'light')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 dark:text-[#E5E3DF]">
        {lang === 'zh' ? '评论' : 'Comments'}
      </h3>
      <Giscus
        id="comments"
        repo="johngai19/johngai-blog"
        repoId="R_kgDORqd6jw"
        category="Announcements"
        categoryId="DIC_kwDORqd6j84C5B4L"
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={theme}
        lang={lang === 'zh' ? 'zh-CN' : 'en'}
        loading="lazy"
      />
    </div>
  )
}
