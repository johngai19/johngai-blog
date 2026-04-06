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
  const nextPath = searchParams.get('next') || '/dashboard'

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
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
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
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAFAF8] dark:bg-[#1A1A1A]">
      <div className="w-full max-w-sm">
        {/* Back link */}
        <Link
          href={`/?lang=${lang}`}
          className="inline-flex items-center gap-1 text-sm mb-8 transition-opacity hover:opacity-60 text-gray-500 dark:text-gray-400"
        >
          <ArrowLeft size={14} />
          {lang === 'zh' ? '返回首页' : 'Back to home'}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white mb-4 bg-amber-600">
            J
          </div>
          <h1 className="text-2xl font-semibold mb-1 text-gray-900 dark:text-gray-100">
            {lang === 'zh' ? '登录账号' : 'Sign in'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lang === 'zh'
              ? '登录后可管理订阅和访问会员内容'
              : 'Sign in to manage your subscription and access member content'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {magicSent ? (
          <div className="p-4 rounded-xl text-sm text-center bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">
            <p className="font-medium mb-1">
              {lang === 'zh' ? '邮件已发送！' : 'Email sent!'}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
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
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-opacity hover:opacity-80 disabled:opacity-50 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
            >
              {githubLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Github size={16} />
              )}
              {lang === 'zh' ? '使用 GitHub 登录' : 'Continue with GitHub'}
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {lang === 'zh' ? '或' : 'or'}
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Magic Link */}
            <form onSubmit={handleMagicLink} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-500 dark:text-gray-400">
                  {lang === 'zh' ? '邮箱地址' : 'Email address'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={lang === 'zh' ? '请输入邮箱' : 'Enter your email'}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-amber-600 dark:focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-opacity hover:opacity-80 disabled:opacity-50 bg-amber-600 text-white"
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

        <p className="mt-6 text-xs text-center text-gray-400 dark:text-gray-500">
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
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAF8] dark:bg-[#1A1A1A]" />}>
      <LoginContent />
    </Suspense>
  )
}
