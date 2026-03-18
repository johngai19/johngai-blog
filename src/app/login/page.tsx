'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Github, Mail, ArrowLeft, Loader2 } from 'lucide-react'

function LoginContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [error, setError] = useState('')
  const lang = searchParams.get('lang') ?? 'zh'

  useEffect(() => {
    if (searchParams.get('error') === 'auth') {
      setError(lang === 'zh' ? '登录失败，请重试。' : 'Login failed, please try again.')
    }
  }, [searchParams, lang])

  const handleGitHubLogin = async () => {
    setGithubLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
    if (error) {
      setError(lang === 'zh' ? '登录失败，请重试。' : 'Login failed, please try again.')
      setGithubLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
    if (error) {
      setError(lang === 'zh' ? '发送失败，请检查邮箱地址。' : 'Failed to send, please check your email.')
    } else {
      setMagicSent(true)
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#FAFAF8' }}
    >
      <div className="w-full max-w-sm">
        {/* Back link */}
        <Link
          href={`/?lang=${lang}`}
          className="inline-flex items-center gap-1 text-sm mb-8 transition-opacity hover:opacity-60"
          style={{ color: '#6B7280' }}
        >
          <ArrowLeft size={14} />
          {lang === 'zh' ? '返回首页' : 'Back to home'}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white mb-4"
            style={{ backgroundColor: '#D4830A' }}
          >
            J
          </div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#1A1A1A' }}>
            {lang === 'zh' ? '登录账号' : 'Sign in'}
          </h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            {lang === 'zh'
              ? '登录后可管理订阅和访问会员内容'
              : 'Sign in to manage your subscription and access member content'}
          </p>
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
          >
            {error}
          </div>
        )}

        {magicSent ? (
          <div
            className="p-4 rounded-xl text-sm text-center"
            style={{ backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}
          >
            <p className="font-medium mb-1">
              {lang === 'zh' ? '邮件已发送！' : 'Email sent!'}
            </p>
            <p style={{ color: '#6B7280' }}>
              {lang === 'zh'
                ? `请查收 ${email} 的登录链接`
                : `Check ${email} for your sign-in link`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* GitHub OAuth - Primary */}
            <button
              onClick={handleGitHubLogin}
              disabled={githubLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}
            >
              {githubLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Github size={16} />
              )}
              {lang === 'zh' ? '使用 GitHub 登录' : 'Continue with GitHub'}
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: '#E5E3DF' }} />
              <span className="text-xs" style={{ color: '#9CA3AF' }}>
                {lang === 'zh' ? '或' : 'or'}
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: '#E5E3DF' }} />
            </div>

            {/* Magic Link */}
            <form onSubmit={handleMagicLink} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>
                  {lang === 'zh' ? '邮箱地址' : 'Email address'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={lang === 'zh' ? '请输入邮箱' : 'Enter your email'}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all"
                  style={{
                    borderColor: '#E5E3DF',
                    backgroundColor: '#FFFFFF',
                    color: '#1A1A1A',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#D4830A')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E3DF')}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: '#D4830A', color: '#FFFFFF' }}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Mail size={16} />
                )}
                {lang === 'zh' ? '发送登录链接' : 'Send magic link'}
              </button>
            </form>
          </div>
        )}

        <p className="mt-6 text-xs text-center" style={{ color: '#9CA3AF' }}>
          {lang === 'zh' ? '登录即表示同意' : 'By signing in you agree to our'}{' '}
          <Link href="/terms" className="underline">
            {lang === 'zh' ? '服务条款' : 'Terms of Service'}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }} />}>
      <LoginContent />
    </Suspense>
  )
}
