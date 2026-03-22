'use client'

import { useState } from 'react'
import { Sparkles, Copy, Check, X, Loader2 } from 'lucide-react'

type Action = 'polish' | 'summarize' | 'translate' | 'suggest_title' | 'categorize'
type Lang = 'zh' | 'en'

interface AIAssistPanelProps {
  content: string
  title?: string
  activeLang: Lang
  onApplyContent?: (text: string) => void
  onApplyExcerpt?: (lang: Lang, text: string) => void
  onApplyTitle?: (zhTitle: string, enTitle: string) => void
  onApplyCategory?: (category: string, tags: string[]) => void
}

interface CategorizeResult {
  category: string
  tags: string[]
  reason: string
}

const ACTION_LABELS: Record<Action, { label: string; desc: string }> = {
  polish: { label: '润色', desc: 'Polish selected content' },
  summarize: { label: '生成摘要', desc: 'Generate excerpt' },
  translate: { label: '翻译', desc: 'Translate zh↔en' },
  suggest_title: { label: '标题建议', desc: 'Suggest better titles' },
  categorize: { label: '智能分类', desc: 'Auto-categorize & tag' },
}

export default function AIAssistPanel({
  content,
  title,
  activeLang,
  onApplyContent,
  onApplyExcerpt,
  onApplyTitle,
  onApplyCategory,
}: AIAssistPanelProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [parsed, setParsed] = useState<CategorizeResult | null>(null)
  const [currentAction, setCurrentAction] = useState<Action | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const run = async (action: Action) => {
    if (!content.trim()) {
      setError('请先输入文章内容')
      return
    }
    setLoading(true)
    setError('')
    setResult('')
    setParsed(null)
    setCurrentAction(action)

    try {
      const res = await fetch('/api/admin/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          content,
          title,
          lang: activeLang,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'AI request failed')
      } else {
        setResult(data.result ?? '')
        if (data.parsed) setParsed(data.parsed)
      }
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }

  const copyToClipboard = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const applyResult = () => {
    if (!result || !currentAction) return

    if (currentAction === 'polish' || currentAction === 'translate') {
      onApplyContent?.(result)
    } else if (currentAction === 'summarize') {
      onApplyExcerpt?.(activeLang, result)
    } else if (currentAction === 'suggest_title') {
      // Parse first suggestion from the formatted output
      const lines = result.split('\n')
      let zh = ''
      let en = ''
      for (const line of lines) {
        const zhMatch = line.match(/1\.\s*ZH:\s*(.+)/)
        const enMatch = line.match(/EN:\s*(.+)/)
        if (zhMatch && !zh) zh = zhMatch[1].trim()
        if (enMatch && !en) en = enMatch[1].trim()
        if (zh && en) break
      }
      if (zh || en) onApplyTitle?.(zh, en)
    } else if (currentAction === 'categorize' && parsed) {
      onApplyCategory?.(parsed.category, parsed.tags)
    }
    setResult('')
    setParsed(null)
    setCurrentAction(null)
  }

  const clearResult = () => {
    setResult('')
    setParsed(null)
    setCurrentAction(null)
    setError('')
  }

  return (
    <div
      className="rounded-xl border"
      style={{ borderColor: '#E5E3DF', backgroundColor: '#FFFFFF' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: '#F3F4F6' }}
      >
        <Sparkles size={14} style={{ color: '#D4830A' }} />
        <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
          AI 助手
        </span>
        <span className="text-xs ml-1" style={{ color: '#9CA3AF' }}>
          GPT-4o
        </span>
      </div>

      {/* Action buttons */}
      <div className="p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(Object.keys(ACTION_LABELS) as Action[]).map((action) => (
            <button
              key={action}
              onClick={() => run(action)}
              disabled={loading}
              title={ACTION_LABELS[action].desc}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50"
              style={{
                borderColor: currentAction === action && loading ? '#D4830A' : '#E5E3DF',
                color: currentAction === action && loading ? '#D4830A' : '#4B5563',
                backgroundColor:
                  currentAction === action && loading ? '#FFF7ED' : '#FAFAF8',
              }}
            >
              {loading && currentAction === action ? (
                <Loader2 size={11} className="animate-spin" />
              ) : null}
              {ACTION_LABELS[action].label}
            </button>
          ))}
        </div>

        {/* Hint text */}
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          {activeLang === 'zh' ? '当前: 中文内容' : 'Current: English content'} · 翻译: {activeLang === 'zh' ? 'zh→en' : 'en→zh'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mx-4 mb-3 px-3 py-2 rounded-lg text-xs"
          style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
        >
          {error}
        </div>
      )}

      {/* Result */}
      {(result || parsed) && (
        <div
          className="mx-4 mb-4 rounded-lg border"
          style={{ borderColor: '#E5E3DF' }}
        >
          {/* Result header */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b"
            style={{ borderColor: '#F3F4F6', backgroundColor: '#FAFAF8' }}
          >
            <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
              {currentAction ? ACTION_LABELS[currentAction].label : ''} 结果
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={copyToClipboard}
                className="p-1 rounded hover:opacity-70 transition-opacity"
                title="Copy to clipboard"
                style={{ color: '#9CA3AF' }}
              >
                {copied ? <Check size={12} style={{ color: '#16A34A' }} /> : <Copy size={12} />}
              </button>
              <button
                onClick={clearResult}
                className="p-1 rounded hover:opacity-70 transition-opacity"
                style={{ color: '#9CA3AF' }}
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Result content */}
          <div className="p-3">
            {currentAction === 'categorize' && parsed ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>分类:</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: '#FFF7ED', color: '#D4830A' }}
                  >
                    {parsed.category}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>标签:</span>
                  {parsed.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {parsed.reason && (
                  <p className="text-xs italic" style={{ color: '#9CA3AF' }}>
                    {parsed.reason}
                  </p>
                )}
              </div>
            ) : (
              <pre
                className="text-xs whitespace-pre-wrap leading-relaxed"
                style={{ color: '#1A1A1A', fontFamily: 'inherit' }}
              >
                {result}
              </pre>
            )}
          </div>

          {/* Apply button */}
          {currentAction &&
            ['polish', 'translate', 'summarize', 'suggest_title', 'categorize'].includes(
              currentAction
            ) && (
              <div
                className="px-3 pb-3"
              >
                <button
                  onClick={applyResult}
                  className="w-full py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#D4830A' }}
                >
                  {currentAction === 'polish' || currentAction === 'translate'
                    ? '应用到编辑器'
                    : currentAction === 'summarize'
                      ? '应用为摘要'
                      : currentAction === 'suggest_title'
                        ? '应用第一个标题'
                        : '应用分类和标签'}
                </button>
              </div>
            )}
        </div>
      )}
    </div>
  )
}
