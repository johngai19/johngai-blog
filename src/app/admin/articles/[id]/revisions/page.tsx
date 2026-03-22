'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Clock, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'

interface Revision {
  id: string
  article_id: string
  title_zh: string | null
  title_en: string | null
  content_zh: string | null
  content_en: string | null
  edited_by: string
  created_at: string
  content_zh_len: number
  content_en_len: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// Very simple line-based diff: renders old/new side-by-side with +/- highlights
function DiffView({
  oldText,
  newText,
  label,
}: {
  oldText: string | null
  newText: string | null
  label: string
}) {
  const oldLines = (oldText ?? '').split('\n')
  const newLines = (newText ?? '').split('\n')
  const maxLen = Math.max(oldLines.length, newLines.length)

  return (
    <div className="mb-4">
      <p className="text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>
        {label}
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div
          className="rounded-lg border p-3 overflow-x-auto"
          style={{ borderColor: '#FECACA', backgroundColor: '#FFF5F5' }}
        >
          <p className="font-semibold mb-1" style={{ color: '#DC2626' }}>
            旧版本 (此修订)
          </p>
          {Array.from({ length: maxLen }).map((_, i) => {
            const line = oldLines[i] ?? ''
            const changed = line !== (newLines[i] ?? '')
            return (
              <div
                key={i}
                style={{
                  backgroundColor: changed ? '#FECACA' : 'transparent',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  minHeight: '1.2em',
                }}
              >
                {line}
              </div>
            )
          })}
        </div>
        <div
          className="rounded-lg border p-3 overflow-x-auto"
          style={{ borderColor: '#BBF7D0', backgroundColor: '#F0FFF4' }}
        >
          <p className="font-semibold mb-1" style={{ color: '#16A34A' }}>
            当前版本
          </p>
          {Array.from({ length: maxLen }).map((_, i) => {
            const line = newLines[i] ?? ''
            const changed = line !== (oldLines[i] ?? '')
            return (
              <div
                key={i}
                style={{
                  backgroundColor: changed ? '#BBF7D0' : 'transparent',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  minHeight: '1.2em',
                }}
              >
                {line}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function RevisionsPage() {
  const router = useRouter()
  const params = useParams()
  const articleId = params.id as string

  const [revisions, setRevisions] = useState<Revision[]>([])
  const [currentArticle, setCurrentArticle] = useState<{
    title_zh: string | null
    title_en: string | null
    content_zh: string | null
    content_en: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [restoring, setRestoring] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [revRes, artRes] = await Promise.all([
        fetch(`/api/admin/articles/${articleId}/revisions`),
        fetch(`/api/admin/articles?id=${articleId}`),
      ])
      const revData = await revRes.json()
      const artData = await artRes.json()

      if (revRes.ok) setRevisions(revData)
      else setError(revData.error ?? 'Failed to load revisions')

      if (artRes.ok) setCurrentArticle(artData)
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }, [articleId])

  useEffect(() => {
    load()
  }, [load])

  const restore = async (revisionId: string) => {
    if (!confirm('确定要还原到这个版本？当前版本会先被保存为一条新修订记录。')) return
    setRestoring(revisionId)
    setError('')
    setSuccessMsg('')
    try {
      const res = await fetch(`/api/admin/articles/${articleId}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Restore failed')
      } else {
        setSuccessMsg('已成功还原！当前版本已被保存为新修订记录。')
        await load()
      }
    } catch {
      setError('Network error')
    }
    setRestoring(null)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-3 border-b"
        style={{ borderColor: '#E5E3DF', backgroundColor: '#FFFFFF' }}
      >
        <button
          onClick={() => router.push(`/admin/articles/${articleId}/edit`)}
          className="p-1.5 rounded-lg hover:opacity-60 transition-opacity"
          style={{ color: '#6B7280' }}
        >
          <ArrowLeft size={16} />
        </button>
        <Clock size={14} style={{ color: '#D4830A' }} />
        <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
          修订历史
        </span>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-lg text-sm"
            style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
          >
            {error}
          </div>
        )}
        {successMsg && (
          <div
            className="mb-4 px-4 py-3 rounded-lg text-sm"
            style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}
          >
            {successMsg}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-center py-12" style={{ color: '#9CA3AF' }}>
            加载中…
          </div>
        ) : revisions.length === 0 ? (
          <div
            className="rounded-xl border p-12 text-center text-sm"
            style={{ borderColor: '#E5E3DF', color: '#9CA3AF', backgroundColor: '#FFFFFF' }}
          >
            暂无修订记录。每次保存文章时，旧版本会自动记录到这里。
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
              共 {revisions.length} 条修订记录，点击可展开查看内容对比。
            </p>
            {revisions.map((rev, idx) => {
              const isExpanded = expandedId === rev.id
              const isRestoring = restoring === rev.id
              // For diff: compare rev (old) vs current article
              const showDiff = isExpanded && currentArticle

              return (
                <div
                  key={rev.id}
                  className="rounded-xl border overflow-hidden"
                  style={{ borderColor: '#E5E3DF', backgroundColor: '#FFFFFF' }}
                >
                  {/* Revision header row */}
                  <div
                    className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : rev.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {idx === 0 && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded font-medium"
                            style={{ backgroundColor: '#FFF7ED', color: '#D4830A' }}
                          >
                            最近
                          </span>
                        )}
                        <span className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>
                          {rev.title_zh || rev.title_en || '(无标题)'}
                        </span>
                        {rev.title_en && rev.title_zh && (
                          <span className="text-xs truncate" style={{ color: '#9CA3AF' }}>
                            / {rev.title_en}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>
                          {formatDate(rev.created_at)}
                        </span>
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>
                          by {rev.edited_by}
                        </span>
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>
                          ZH {rev.content_zh_len} 字 / EN {rev.content_en_len} chars
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        restore(rev.id)
                      }}
                      disabled={isRestoring}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:opacity-80"
                      style={{ borderColor: '#D4830A', color: '#D4830A' }}
                    >
                      <RotateCcw size={11} />
                      {isRestoring ? '还原中…' : '还原'}
                    </button>

                    <div style={{ color: '#9CA3AF' }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {/* Expanded diff view */}
                  {showDiff && (
                    <div
                      className="px-5 pb-5 pt-4 border-t"
                      style={{ borderColor: '#F3F4F6' }}
                    >
                      <DiffView
                        oldText={rev.title_zh}
                        newText={currentArticle.title_zh}
                        label="中文标题"
                      />
                      <DiffView
                        oldText={rev.title_en}
                        newText={currentArticle.title_en}
                        label="English Title"
                      />
                      <DiffView
                        oldText={rev.content_zh}
                        newText={currentArticle.content_zh}
                        label="中文内容"
                      />
                      <DiffView
                        oldText={rev.content_en}
                        newText={currentArticle.content_en}
                        label="English Content"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
