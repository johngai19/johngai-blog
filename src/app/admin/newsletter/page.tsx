'use client'

import { useState, useEffect } from 'react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Send, Eye, EyeOff, ChevronDown, Users, AlertCircle, CheckCircle } from 'lucide-react'

interface Article {
  id: string
  slug: string
  title_zh: string | null
  title_en: string | null
  excerpt_zh: string | null
  excerpt_en: string | null
  status: string
}

interface SubscriberCounts {
  total: number
  confirmed: number
  zh: number
  en: number
  both: number
}

type SendStatus = 'idle' | 'sending' | 'success' | 'error'

export default function NewsletterPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [counts, setCounts] = useState<SubscriberCounts | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [selectedSlug, setSelectedSlug] = useState('')
  const [subjectZh, setSubjectZh] = useState('')
  const [subjectEn, setSubjectEn] = useState('')
  const [contentZh, setContentZh] = useState('')
  const [contentEn, setContentEn] = useState('')

  // UI state
  const [previewLang, setPreviewLang] = useState<'zh' | 'en'>('zh')
  const [showPreview, setShowPreview] = useState(false)
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle')
  const [sendResult, setSendResult] = useState<{ sent?: number; failed?: number; mock?: boolean; message?: string } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'zh' | 'en'>('zh')

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const [{ data: arts }, { data: subs }] = await Promise.all([
        supabase
          .from('articles')
          .select('id, slug, title_zh, title_en, excerpt_zh, excerpt_en, status')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(50),
        supabase.from('email_subscribers').select('email, language_preference, confirmed'),
      ])

      setArticles((arts as Article[]) ?? [])

      if (subs) {
        const confirmed = subs.filter((s) => s.confirmed)
        setCounts({
          total: subs.length,
          confirmed: confirmed.length,
          zh: confirmed.filter((s) => s.language_preference === 'zh').length,
          en: confirmed.filter((s) => s.language_preference === 'en').length,
          both: confirmed.filter((s) => !s.language_preference || s.language_preference === 'both').length,
        })
      }

      setLoading(false)
    }
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleArticleSelect = (slug: string) => {
    setSelectedSlug(slug)
    if (!slug) return

    const article = articles.find((a) => a.slug === slug)
    if (!article) return

    if (article.title_zh) setSubjectZh(article.title_zh)
    if (article.title_en) setSubjectEn(article.title_en ?? '')

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://johngai.com'
    const url = `${siteUrl}/articles/${slug}`

    if (article.excerpt_zh) {
      setContentZh(`${article.excerpt_zh}\n\n[阅读全文](${url})`)
    }
    if (article.excerpt_en) {
      setContentEn(`${article.excerpt_en ?? ''}\n\n[Read more](${url})`)
    }
  }

  const handleSend = async () => {
    setConfirmOpen(false)
    setSendStatus('sending')
    setSendResult(null)

    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_zh: subjectZh || undefined,
          subject_en: subjectEn || undefined,
          content_zh: contentZh || undefined,
          content_en: contentEn || undefined,
          articleSlug: selectedSlug || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setSendStatus('error')
        setSendResult({ message: data.error ?? 'Send failed' })
      } else {
        setSendStatus('success')
        setSendResult(data)
      }
    } catch (err) {
      setSendStatus('error')
      setSendResult({ message: String(err) })
    }
  }

  const isFormValid =
    (subjectZh.trim() && contentZh.trim()) || (subjectEn.trim() && contentEn.trim())

  const renderMarkdownPreview = (text: string) => {
    // Very simple markdown to HTML for preview
    return text
      .split('\n\n')
      .map((para, i) => {
        const t = para.trim()
        if (!t) return null
        if (t.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mb-3 text-[#1A1A1A]">{t.slice(2)}</h1>
        if (t.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold mb-2 text-[#1A1A1A]">{t.slice(3)}</h2>
        if (t.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold mb-2 text-[#1A1A1A]">{t.slice(4)}</h3>
        // Handle inline links: [text](url)
        const withLinks = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#D4830A] underline">$1</a>')
        return <p key={i} className="mb-3 leading-7 text-[#374151]" dangerouslySetInnerHTML={{ __html: withLinks }} />
      })
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A1A] dark:text-[#E5E3DF]">Newsletter</h1>
        <p className="text-sm mt-0.5 text-[#9CA3AF]">向订阅者发送邮件通讯</p>
      </div>

      {/* Subscriber stats */}
      {!loading && counts && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: '总订阅', value: counts.total },
            { label: '已确认', value: counts.confirmed, highlight: true },
            { label: '中文', value: counts.zh + counts.both },
            { label: '英文', value: counts.en + counts.both },
          ].map(({ label, value, highlight }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
              style={{
                backgroundColor: highlight ? '#FEF3C7' : '#FFFFFF',
                borderColor: highlight ? '#FDE68A' : '#E5E3DF',
                color: highlight ? '#92400E' : '#374151',
              }}
            >
              <Users size={13} style={{ color: highlight ? '#D4830A' : '#9CA3AF' }} />
              <span className="font-semibold">{value}</span>
              <span style={{ color: '#9CA3AF' }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Send status banner */}
      {sendStatus === 'success' && sendResult && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
          <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-green-800">
              {sendResult.mock ? '模拟发送成功（未配置 RESEND_API_KEY）' : '发送成功'}
            </p>
            <p className="text-green-700 mt-0.5">
              {sendResult.mock
                ? `将向 ${sendResult.sent} 位订阅者发送（实际未发送）`
                : `已发送 ${sendResult.sent} 封${sendResult.failed ? `，失败 ${sendResult.failed} 封` : ''}`}
            </p>
          </div>
        </div>
      )}

      {sendStatus === 'error' && sendResult && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{sendResult.message}</p>
        </div>
      )}

      {/* Form */}
      <div className="rounded-2xl border bg-white dark:bg-[#242424] border-[#E5E3DF] dark:border-[#333333] overflow-hidden">
        <div className="p-5 space-y-5">
          {/* Article selector */}
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
              从文章自动生成（可选）
            </label>
            <div className="relative">
              <select
                value={selectedSlug}
                onChange={(e) => handleArticleSelect(e.target.value)}
                className="w-full appearance-none border rounded-xl px-3 py-2.5 pr-8 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#D4830A] border-[#E5E3DF]"
              >
                <option value="">不选择文章，手动填写</option>
                {articles.map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.title_zh ?? a.title_en ?? a.slug}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
            </div>
          </div>

          {/* Language tabs */}
          <div>
            <div className="flex gap-1 p-1 rounded-xl w-fit mb-4" style={{ backgroundColor: '#F3F4F6' }}>
              {(['zh', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveTab(lang)}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: activeTab === lang ? '#FFFFFF' : 'transparent',
                    color: activeTab === lang ? '#1A1A1A' : '#6B7280',
                    boxShadow: activeTab === lang ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {lang === 'zh' ? '中文' : 'English'}
                </button>
              ))}
            </div>

            {activeTab === 'zh' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">主题（中文）</label>
                  <input
                    type="text"
                    value={subjectZh}
                    onChange={(e) => setSubjectZh(e.target.value)}
                    placeholder="邮件主题"
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4830A] border-[#E5E3DF] text-[#1A1A1A] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">正文（支持 Markdown）</label>
                  <textarea
                    value={contentZh}
                    onChange={(e) => setContentZh(e.target.value)}
                    placeholder="邮件正文内容，支持 Markdown 格式..."
                    rows={10}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D4830A] border-[#E5E3DF] text-[#1A1A1A] bg-white resize-y"
                  />
                </div>
              </div>
            )}

            {activeTab === 'en' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Subject (English)</label>
                  <input
                    type="text"
                    value={subjectEn}
                    onChange={(e) => setSubjectEn(e.target.value)}
                    placeholder="Email subject"
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4830A] border-[#E5E3DF] text-[#1A1A1A] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Content (Markdown supported)</label>
                  <textarea
                    value={contentEn}
                    onChange={(e) => setContentEn(e.target.value)}
                    placeholder="Email body content, Markdown supported..."
                    rows={10}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D4830A] border-[#E5E3DF] text-[#1A1A1A] bg-white resize-y"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-[#E5E3DF] dark:border-[#333333] flex items-center justify-between">
          <button
            onClick={() => {
              setShowPreview(!showPreview)
              setPreviewLang(activeTab)
            }}
            className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
          >
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPreview ? '隐藏预览' : '预览'}
          </button>

          <button
            disabled={!isFormValid || sendStatus === 'sending'}
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: '#1A1A1A' }}
          >
            <Send size={13} />
            {sendStatus === 'sending' ? '发送中…' : '发送 Newsletter'}
          </button>
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="rounded-2xl border bg-white border-[#E5E3DF] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E5E3DF] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">
              邮件预览 — {previewLang === 'zh' ? '中文' : 'English'}
            </h2>
            <div className="flex gap-1 p-0.5 rounded-lg" style={{ backgroundColor: '#F3F4F6' }}>
              {(['zh', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setPreviewLang(lang)}
                  className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: previewLang === lang ? '#FFFFFF' : 'transparent',
                    color: previewLang === lang ? '#1A1A1A' : '#6B7280',
                  }}
                >
                  {lang === 'zh' ? '中文' : 'EN'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Email header mockup */}
            <div className="max-w-xl mx-auto border border-[#E5E3DF] rounded-xl overflow-hidden">
              <div className="bg-[#1A1A1A] px-6 py-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#D4830A] flex items-center justify-center text-xs font-bold text-white">J</div>
                <span className="text-sm font-semibold text-white">johngai.com</span>
              </div>
              <div className="px-6 pt-6">
                <h1 className="text-2xl font-bold text-[#1A1A1A] leading-tight">
                  {previewLang === 'zh' ? (subjectZh || '（无主题）') : (subjectEn || '(No subject)')}
                </h1>
                <hr className="mt-4 border-none border-t-2 border-[#D4830A] w-12" style={{ borderTopWidth: 2, borderTopColor: '#D4830A' }} />
              </div>
              <div className="px-6 py-6">
                {previewLang === 'zh'
                  ? renderMarkdownPreview(contentZh || '（无内容）')
                  : renderMarkdownPreview(contentEn || '(No content)')}
              </div>
              <div className="px-6 py-4 bg-[#F9FAFB] border-t border-[#E5E3DF]">
                <p className="text-xs text-[#9CA3AF]">
                  {previewLang === 'zh'
                    ? '您收到此邮件是因为您订阅了 johngai.com 的Newsletter。'
                    : 'You received this email because you subscribed to johngai.com newsletter.'}
                </p>
                <a href="#" className="text-xs text-[#D4830A] underline mt-1 block">
                  {previewLang === 'zh' ? '取消订阅' : 'Unsubscribe'}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border border-[#E5E3DF] p-6 max-w-sm w-full mx-4 shadow-xl">
            <h2 className="text-base font-semibold text-[#1A1A1A] mb-2">确认发送</h2>
            <p className="text-sm text-[#6B7280] mb-1">
              将向 <strong className="text-[#1A1A1A]">{counts?.confirmed ?? '?'}</strong> 位已确认订阅者发送 Newsletter。
            </p>
            <p className="text-sm text-[#6B7280] mb-5">此操作无法撤回。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2 rounded-xl border text-sm font-medium text-[#6B7280] border-[#E5E3DF] hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSend}
                className="flex-1 py-2 rounded-xl text-sm font-medium text-white bg-[#1A1A1A] hover:opacity-80 transition-opacity"
              >
                确认发送
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
