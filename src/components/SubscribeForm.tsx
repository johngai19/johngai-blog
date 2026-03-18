'use client'

import { useState } from 'react'
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface SubscribeFormProps {
  lang?: 'zh' | 'en'
  compact?: boolean
}

export default function SubscribeForm({ lang = 'zh', compact = false }: SubscribeFormProps) {
  const [email, setEmail] = useState('')
  const [langPref, setLangPref] = useState<'zh' | 'en' | 'both'>(lang === 'zh' ? 'zh' : 'en')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, language: langPref }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(
          lang === 'zh'
            ? '订阅成功！感谢您的关注。'
            : 'Subscribed! Thanks for joining.'
        )
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || (lang === 'zh' ? '订阅失败，请稍后再试。' : 'Subscription failed. Please try again.'))
      }
    } catch {
      setStatus('error')
      setMessage(lang === 'zh' ? '网络错误，请稍后再试。' : 'Network error. Please try again.')
    }
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={lang === 'zh' ? '您的邮箱' : 'Your email'}
          required
          className="flex-1 min-w-0 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
          style={{
            borderColor: '#E5E3DF',
            backgroundColor: '#FFFFFF',
          }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#D4830A' }}
        >
          {status === 'loading' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : lang === 'zh' ? '订阅' : 'Subscribe'}
        </button>
      </form>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      {status === 'success' ? (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: '#F0FDF4' }}>
          <CheckCircle size={20} style={{ color: '#16A34A' }} />
          <p className="text-sm" style={{ color: '#15803D' }}>{message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="sub-email">
              {lang === 'zh' ? '邮箱地址' : 'Email address'}
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: '#9CA3AF' }}
              />
              <input
                id="sub-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={lang === 'zh' ? '请输入您的邮箱' : 'Enter your email'}
                required
                className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-offset-0"
                style={{ borderColor: '#E5E3DF', backgroundColor: '#FFFFFF' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              {lang === 'zh' ? '内容语言偏好' : 'Language preference'}
            </label>
            <div className="flex gap-2">
              {(['zh', 'en', 'both'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLangPref(l)}
                  className="flex-1 py-2 rounded-lg border text-sm font-medium transition-colors"
                  style={{
                    borderColor: langPref === l ? '#D4830A' : '#E5E3DF',
                    backgroundColor: langPref === l ? '#F5E6C8' : '#FFFFFF',
                    color: langPref === l ? '#D4830A' : '#6B7280',
                  }}
                >
                  {l === 'zh' ? '中文' : l === 'en' ? 'English' : lang === 'zh' ? '两者' : 'Both'}
                </button>
              ))}
            </div>
          </div>

          {status === 'error' && message && (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#DC2626' }}>
              <AlertCircle size={14} />
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#D4830A' }}
          >
            {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
            {lang === 'zh' ? '立即订阅' : 'Subscribe Now'}
          </button>
        </form>
      )}
    </div>
  )
}
