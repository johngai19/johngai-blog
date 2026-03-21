'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Save,
  Eye,
  EyeOff,
  Globe,
  FileText,
  Trash2,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react'
import { CATEGORIES, CATEGORY_LABELS } from '@/types'

interface ArticleData {
  id?: string
  slug: string
  title_zh: string
  title_en: string
  content_zh: string
  content_en: string
  excerpt_zh: string
  excerpt_en: string
  cover_image: string
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  source: string
  source_url: string
  published_at: string
}

const EMPTY_ARTICLE: ArticleData = {
  slug: '',
  title_zh: '',
  title_en: '',
  content_zh: '',
  content_en: '',
  excerpt_zh: '',
  excerpt_en: '',
  cover_image: '',
  category: '',
  tags: [],
  status: 'draft',
  source: '',
  source_url: '',
  published_at: '',
}

export default function ArticleEditor({ articleId }: { articleId?: string }) {
  const router = useRouter()
  const isNew = !articleId
  const [article, setArticle] = useState<ArticleData>(EMPTY_ARTICLE)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'zh' | 'en'>('zh')
  const [preview, setPreview] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [showMeta, setShowMeta] = useState(true)

  // Load existing article
  useEffect(() => {
    if (!articleId) return
    fetch(`/api/admin/articles?id=${articleId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setArticle({
            id: data.id,
            slug: data.slug ?? '',
            title_zh: data.title_zh ?? '',
            title_en: data.title_en ?? '',
            content_zh: data.content_zh ?? '',
            content_en: data.content_en ?? '',
            excerpt_zh: data.excerpt_zh ?? '',
            excerpt_en: data.excerpt_en ?? '',
            cover_image: data.cover_image ?? '',
            category: data.category ?? '',
            tags: data.tags ?? [],
            status: data.status ?? 'draft',
            source: data.source ?? '',
            source_url: data.source_url ?? '',
            published_at: data.published_at
              ? data.published_at.slice(0, 16)
              : '',
          })
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load article')
        setLoading(false)
      })
  }, [articleId])

  const update = useCallback(
    (field: keyof ArticleData, value: string | string[]) => {
      setArticle((prev) => ({ ...prev, [field]: value }))
      setError('')
      setSuccess('')
    },
    []
  )

  // Auto-generate slug from English title
  const autoSlug = useCallback(() => {
    if (article.slug) return
    const src = article.title_en || article.title_zh
    if (!src) return
    const slug = src
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80)
    update('slug', slug)
  }, [article.title_en, article.title_zh, article.slug, update])

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !article.tags.includes(tag)) {
      update('tags', [...article.tags, tag])
    }
    setTagInput('')
  }

  const removeTag = (t: string) => {
    update(
      'tags',
      article.tags.filter((x) => x !== t)
    )
  }

  const save = async (overrideStatus?: 'draft' | 'published') => {
    setSaving(true)
    setError('')
    setSuccess('')

    const status = overrideStatus ?? article.status
    const payload = { ...article, status }

    // Auto-generate slug if empty
    if (!payload.slug) {
      const src = payload.title_en || payload.title_zh || 'untitled'
      payload.slug = src
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80)
    }

    try {
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch('/api/admin/articles', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Save failed')
      } else {
        setSuccess(isNew ? 'Article created!' : 'Saved!')
        if (isNew && data.id) {
          // Redirect to edit page after creation
          router.replace(`/admin/articles/${data.id}/edit`)
        } else {
          setArticle((prev) => ({
            ...prev,
            id: data.id,
            slug: data.slug,
            status: data.status,
          }))
        }
      }
    } catch {
      setError('Network error')
    }
    setSaving(false)
  }

  const deleteArticle = async () => {
    if (!articleId) return
    if (!confirm('确定删除这篇文章？此操作不可撤销。')) return
    const res = await fetch(`/api/admin/articles?id=${articleId}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      router.push('/admin/articles')
    } else {
      const data = await res.json()
      setError(data.error || 'Delete failed')
    }
  }

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="p-8 text-center text-sm" style={{ color: '#9CA3AF' }}>
        加载中…
      </div>
    )
  }

  const content = activeTab === 'zh' ? article.content_zh : article.content_en
  const title = activeTab === 'zh' ? article.title_zh : article.title_en

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 border-b shrink-0"
        style={{ borderColor: '#E5E3DF', backgroundColor: '#FFFFFF' }}
      >
        <button
          onClick={() => router.push('/admin/articles')}
          className="p-1.5 rounded-lg hover:opacity-60 transition-opacity"
          style={{ color: '#6B7280' }}
        >
          <ArrowLeft size={16} />
        </button>
        <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
          {isNew ? '新建文章' : '编辑文章'}
        </span>

        <div className="flex-1" />

        {/* Status indicator */}
        <span
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
          style={{
            backgroundColor:
              article.status === 'published' ? '#DCFCE7' : '#F3F4F6',
            color: article.status === 'published' ? '#16A34A' : '#6B7280',
          }}
        >
          {article.status === 'published' ? (
            <Globe size={11} />
          ) : (
            <FileText size={11} />
          )}
          {article.status === 'published' ? '已发布' : '草稿'}
        </span>

        {/* Preview toggle */}
        <button
          onClick={() => setPreview(!preview)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-colors"
          style={{
            borderColor: preview ? '#D4830A' : '#E5E3DF',
            color: preview ? '#D4830A' : '#6B7280',
          }}
        >
          {preview ? <EyeOff size={12} /> : <Eye size={12} />}
          {preview ? '编辑' : '预览'}
        </button>

        {/* Save as draft */}
        {article.status !== 'published' && (
          <button
            onClick={() => save('draft')}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
            style={{ borderColor: '#E5E3DF', color: '#6B7280' }}
          >
            存草稿
          </button>
        )}

        {/* Publish / Save */}
        <button
          onClick={() =>
            save(article.status === 'published' ? 'published' : undefined)
          }
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#D4830A' }}
        >
          <Save size={12} />
          {saving
            ? '保存中…'
            : article.status === 'published'
              ? '保存'
              : '发布'}
        </button>

        {/* Delete */}
        {!isNew && (
          <button
            onClick={deleteArticle}
            className="p-1.5 rounded-lg hover:opacity-60 transition-opacity"
            style={{ color: '#EF4444' }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Status messages */}
      {error && (
        <div
          className="mx-4 mt-2 px-3 py-2 rounded-lg text-xs"
          style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="mx-4 mt-2 px-3 py-2 rounded-lg text-xs"
          style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}
        >
          {success}
        </div>
      )}

      {/* Main editor area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-5">
          {/* Titles */}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="中文标题"
              value={article.title_zh}
              onChange={(e) => update('title_zh', e.target.value)}
              onBlur={autoSlug}
              className="w-full text-2xl font-bold outline-none placeholder:text-gray-300"
              style={{ color: '#1A1A1A' }}
            />
            <input
              type="text"
              placeholder="English Title"
              value={article.title_en}
              onChange={(e) => update('title_en', e.target.value)}
              onBlur={autoSlug}
              className="w-full text-lg outline-none placeholder:text-gray-300"
              style={{ color: '#4B5563' }}
            />
          </div>

          {/* Language tabs */}
          <div className="flex items-center gap-2 border-b" style={{ borderColor: '#E5E3DF' }}>
            {(['zh', 'en'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveTab(lang)}
                className="px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  color: activeTab === lang ? '#D4830A' : '#9CA3AF',
                  borderBottom:
                    activeTab === lang ? '2px solid #D4830A' : '2px solid transparent',
                }}
              >
                {lang === 'zh' ? '中文内容' : 'English Content'}
              </button>
            ))}
          </div>

          {/* Content editor / preview */}
          <div
            className="rounded-xl border"
            style={{
              borderColor: '#E5E3DF',
              backgroundColor: '#FFFFFF',
              minHeight: '400px',
            }}
          >
            {preview ? (
              <div className="p-6 prose prose-sm max-w-none">
                <h1>{title || '(无标题)'}</h1>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || '*暂无内容*'}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) =>
                  update(
                    activeTab === 'zh' ? 'content_zh' : 'content_en',
                    e.target.value
                  )
                }
                placeholder={
                  activeTab === 'zh'
                    ? '在这里写中文内容… (支持 Markdown)'
                    : 'Write English content here… (Markdown supported)'
                }
                className="w-full h-full min-h-[400px] p-5 text-sm leading-relaxed outline-none resize-y font-mono"
                style={{ color: '#1A1A1A', backgroundColor: 'transparent' }}
              />
            )}
          </div>

          {/* Metadata panel (collapsible) */}
          <div
            className="rounded-xl border"
            style={{ borderColor: '#E5E3DF', backgroundColor: '#FFFFFF' }}
          >
            <button
              onClick={() => setShowMeta(!showMeta)}
              className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium"
              style={{ color: '#1A1A1A' }}
            >
              文章设置
              <ChevronDown
                size={14}
                style={{
                  transform: showMeta ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                  color: '#9CA3AF',
                }}
              />
            </button>

            {showMeta && (
              <div
                className="px-5 pb-5 space-y-4 border-t"
                style={{ borderColor: '#F3F4F6' }}
              >
                {/* Slug */}
                <div className="pt-4">
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: '#6B7280' }}
                  >
                    Slug (URL)
                  </label>
                  <div className="flex items-center gap-1 text-xs" style={{ color: '#9CA3AF' }}>
                    <span>johngai.com/articles/</span>
                    <input
                      type="text"
                      value={article.slug}
                      onChange={(e) => update('slug', e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#E5E3DF', color: '#1A1A1A' }}
                    />
                  </div>
                </div>

                {/* Category + Status row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: '#6B7280' }}
                    >
                      分类
                    </label>
                    <select
                      value={article.category}
                      onChange={(e) => update('category', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#E5E3DF', color: '#1A1A1A' }}
                    >
                      <option value="">选择分类</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]?.zh ?? cat} /{' '}
                          {CATEGORY_LABELS[cat]?.en ?? cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: '#6B7280' }}
                    >
                      状态
                    </label>
                    <select
                      value={article.status}
                      onChange={(e) =>
                        update(
                          'status',
                          e.target.value as 'draft' | 'published' | 'archived'
                        )
                      }
                      className="w-full px-2 py-1.5 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#E5E3DF', color: '#1A1A1A' }}
                    >
                      <option value="draft">草稿</option>
                      <option value="published">已发布</option>
                      <option value="archived">已归档</option>
                    </select>
                  </div>
                </div>

                {/* Excerpts */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: '#6B7280' }}
                    >
                      中文摘要
                    </label>
                    <textarea
                      value={article.excerpt_zh}
                      onChange={(e) => update('excerpt_zh', e.target.value)}
                      placeholder="≤150字"
                      rows={2}
                      className="w-full px-2 py-1.5 rounded-lg border text-sm outline-none resize-none"
                      style={{ borderColor: '#E5E3DF', color: '#1A1A1A' }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: '#6B7280' }}
                    >
                      English Excerpt
                    </label>
                    <textarea
                      value={article.excerpt_en}
                      onChange={(e) => update('excerpt_en', e.target.value)}
                      placeholder="≤150 words"
                      rows={2}
                      className="w-full px-2 py-1.5 rounded-lg border text-sm outline-none resize-none"
                      style={{ borderColor: '#E5E3DF', color: '#1A1A1A' }}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: '#6B7280' }}
                  >
                    标签
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                        style={{
                          backgroundColor: '#F3F4F6',
                          color: '#4B5563',
                        }}
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:opacity-60"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag()
                        }
                      }}
                      placeholder="输入标签后回车"
                      className="flex-1 px-2 py-1.5 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#E5E3DF', color: '#1A1A1A' }}
                    />
                    <button
                      onClick={addTag}
                      className="px-3 py-1.5 rounded-lg border text-xs"
                      style={{ borderColor: '#E5E3DF', color: '#6B7280' }}
                    >
                      添加
                    </button>
                  </div>
                </div>

                {/* Cover image + published date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: '#6B7280' }}
                    >
                      封面图 URL
                    </label>
                    <input
                      type="text"
                      value={article.cover_image}
                      onChange={(e) => update('cover_image', e.target.value)}
                      placeholder="/covers/slug.png"
                      className="w-full px-2 py-1.5 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#E5E3DF', color: '#1A1A1A' }}
                    />
                    {article.cover_image && (
                      <img
                        src={article.cover_image}
                        alt="cover preview"
                        className="mt-2 rounded-lg max-h-24 object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: '#6B7280' }}
                    >
                      发布日期
                    </label>
                    <input
                      type="datetime-local"
                      value={article.published_at}
                      onChange={(e) => update('published_at', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#E5E3DF', color: '#1A1A1A' }}
                    />
                  </div>
                </div>

                {/* Source */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: '#6B7280' }}
                    >
                      来源
                    </label>
                    <input
                      type="text"
                      value={article.source}
                      onChange={(e) => update('source', e.target.value)}
                      placeholder="weizhiyong / baidu / zhihu"
                      className="w-full px-2 py-1.5 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#E5E3DF', color: '#1A1A1A' }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: '#6B7280' }}
                    >
                      原始链接
                    </label>
                    <input
                      type="url"
                      value={article.source_url}
                      onChange={(e) => update('source_url', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-2 py-1.5 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#E5E3DF', color: '#1A1A1A' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
