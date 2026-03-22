'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Article } from '@/types'
import { Eye, Edit, CheckSquare, Square, Globe, FileText, Archive, Plus, Trash2 } from 'lucide-react'

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all')

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadArticles = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query
    setArticles((data as Article[]) ?? [])
    setLoading(false)
  }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadArticles()
  }, [loadArticles])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === articles.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(articles.map((a) => a.id)))
    }
  }

  const bulkUpdate = async (status: 'published' | 'draft') => {
    if (selected.size === 0) return
    await supabase
      .from('articles')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', Array.from(selected))
    setSelected(new Set())
    loadArticles()
  }

  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`确定删除 ${selected.size} 篇文章？此操作不可撤销。`)) return
    for (const id of Array.from(selected)) {
      await supabase.from('articles').delete().eq('id', id)
    }
    setSelected(new Set())
    loadArticles()
  }

  const statusIcon = (s: string) => {
    if (s === 'published') return <Globe size={12} style={{ color: '#16A34A' }} />
    if (s === 'draft') return <FileText size={12} style={{ color: '#9CA3AF' }} />
    return <Archive size={12} style={{ color: '#6B7280' }} />
  }

  const statusLabel = (s: string) => {
    if (s === 'published') return '已发布'
    if (s === 'draft') return '草稿'
    return '已归档'
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] dark:text-[#E5E3DF]">文章管理</h1>
          <p className="text-sm mt-0.5 text-[#9CA3AF]">{articles.length} 篇文章</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#D4830A' }}
        >
          <Plus size={14} />
          写文章
        </Link>
      </div>

      {/* Filters + bulk actions */}
      <div className="flex items-center gap-3 flex-wrap">
        {(['all', 'published', 'draft', 'archived'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: filter === f ? '#1A1A1A' : undefined,
              color: filter === f ? '#FFFFFF' : '#6B7280',
              border: `1px solid ${filter === f ? '#1A1A1A' : '#E5E3DF'}`,
            }}
          >
            {f === 'all' ? '全部' : f === 'published' ? '已发布' : f === 'draft' ? '草稿' : '已归档'}
          </button>
        ))}

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-[#6B7280]">已选 {selected.size} 篇</span>
            <button
              onClick={() => bulkUpdate('published')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: '#D4830A', color: '#FFFFFF' }}
            >
              批量发布
            </button>
            <button
              onClick={() => bulkUpdate('draft')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E5E3DF] dark:border-[#333333] text-[#6B7280]"
            >
              设为草稿
            </button>
            <button
              onClick={bulkDelete}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ color: '#EF4444' }}
            >
              <Trash2 size={12} />
              删除
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden bg-white dark:bg-[#242424] border-[#E5E3DF] dark:border-[#333333]">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#9CA3AF]">加载中…</div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#9CA3AF]">暂无文章</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F4F6] dark:border-[#2A2A2A]">
                <th className="px-4 py-3 text-left w-10">
                  <button onClick={toggleAll}>
                    {selected.size === articles.length && articles.length > 0
                      ? <CheckSquare size={14} style={{ color: '#D4830A' }} />
                      : <Square size={14} style={{ color: '#9CA3AF' }} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-[#6B7280]">标题</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell text-[#6B7280]">分类</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell text-[#6B7280]">浏览量</th>
                <th className="px-4 py-3 text-left font-medium text-[#6B7280]">状态</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell text-[#6B7280]">日期</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr
                  key={article.id}
                  className="border-b border-[#F9FAFB] dark:border-[#2A2A2A] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors"
                >
                  <td className="px-4 py-3">
                    <button onClick={() => toggleSelect(article.id)}>
                      {selected.has(article.id)
                        ? <CheckSquare size={14} style={{ color: '#D4830A' }} />
                        : <Square size={14} style={{ color: '#D1D5DB' }} />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-56 text-[#1A1A1A] dark:text-[#E5E3DF]">
                      {article.title_zh ?? article.title_en ?? '无标题'}
                    </p>
                    <p className="text-xs truncate max-w-56 text-[#9CA3AF]">
                      {article.title_en ?? article.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-[#6B7280]">
                      {article.category ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="flex items-center gap-1 text-xs text-[#6B7280]">
                      <Eye size={11} />
                      {article.view_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-[#1A1A1A] dark:text-[#E5E3DF]">
                      {statusIcon(article.status)}
                      {statusLabel(article.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-[#9CA3AF]">
                      {article.published_at
                        ? new Date(article.published_at).toLocaleDateString('zh-CN')
                        : new Date(article.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="p-1 rounded transition-opacity hover:opacity-60"
                        style={{ color: '#D4830A' }}
                        title="编辑"
                      >
                        <Edit size={13} />
                      </Link>
                      <Link
                        href={`/articles/${article.slug}`}
                        target="_blank"
                        className="p-1 rounded transition-opacity hover:opacity-60 text-[#9CA3AF]"
                        title="查看"
                      >
                        <Eye size={13} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
