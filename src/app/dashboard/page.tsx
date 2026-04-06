'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { PLANS } from '@/lib/plans'
import type { User } from '@supabase/supabase-js'
import { CreditCard, FileText, Mail, Loader2, CheckCircle, Crown } from 'lucide-react'

interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  subscription_tier: string
  stripe_customer_id: string | null
  created_at: string
}

interface Subscription {
  id: string
  plan: string
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const lang = searchParams.get('lang') ?? 'zh'

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const success = searchParams.get('success') === '1'

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/login?lang=${lang}`)
      return
    }
    setUser(user)

    const [{ data: profileData }, { data: subData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    setProfile(profileData as Profile)
    setSubscription(subData as Subscription | null)
    setLoading(false)
  }, [lang, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleUpgrade = async (plan: 'pro' | 'elite') => {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] dark:bg-[#1A1A1A]">
        <Loader2 className="animate-spin text-amber-600 dark:text-amber-400" />
      </div>
    )
  }

  const displayName = profile?.display_name ?? user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User'
  const avatarUrl = profile?.avatar_url ?? (user?.user_metadata?.avatar_url as string | undefined)
  const tier = profile?.subscription_tier ?? 'free'

  const planLabel = tier === 'free'
    ? (lang === 'zh' ? '免费用户' : 'Free')
    : tier === 'pro'
    ? PLANS.pro[lang === 'zh' ? 'name' : 'nameEn']
    : PLANS.elite[lang === 'zh' ? 'name' : 'nameEn']

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#1A1A1A]">
      {/* Header bar */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href={`/?lang=${lang}`} className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            ← {lang === 'zh' ? '返回首页' : 'Back to site'}
          </Link>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {lang === 'zh' ? '个人账号' : 'Dashboard'}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Admin entrance - only visible to admin user */}
        {user?.email === 'sandcabin83@gmail.com' && (
          <a
            href="/admin"
            className="flex items-center justify-between p-4 rounded-xl text-sm font-medium transition-colors hover:opacity-90 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
          >
            <span className="flex items-center gap-2">
              <Crown size={16} />
              {lang === 'zh' ? '进入管理后台' : 'Enter Admin Dashboard'}
            </span>
            <span>→</span>
          </a>
        )}

        {success && (
          <div className="flex items-center gap-2 p-4 rounded-xl text-sm bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">
            <CheckCircle size={16} />
            {lang === 'zh' ? '订阅成功！欢迎加入会员。' : 'Subscription successful! Welcome aboard.'}
          </div>
        )}

        {/* Profile card */}
        <div className="rounded-2xl border p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white bg-amber-600">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{displayName}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <span
                className={`inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  tier !== 'free'
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
              >
                {tier !== 'free' && <Crown size={10} />}
                {planLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription card */}
        <div className="rounded-2xl border p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <CreditCard size={16} />
            {lang === 'zh' ? '订阅状态' : 'Subscription'}
          </h2>

          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {subscription.plan === 'pro' ? PLANS.pro[lang === 'zh' ? 'name' : 'nameEn'] : PLANS.elite[lang === 'zh' ? 'name' : 'nameEn']}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {subscription.cancel_at_period_end
                      ? (lang === 'zh' ? '将在当前周期结束时取消' : 'Cancels at period end')
                      : (lang === 'zh' ? '自动续费' : 'Auto-renews')}
                    {subscription.current_period_end && (
                      <> · {new Date(subscription.current_period_end).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')}</>
                    )}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    subscription.status === 'active'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  }`}
                >
                  {subscription.status === 'active'
                    ? (lang === 'zh' ? '正常' : 'Active')
                    : subscription.status === 'trialing'
                    ? (lang === 'zh' ? '试用中' : 'Trial')
                    : subscription.status === 'past_due'
                    ? (lang === 'zh' ? '欠费' : 'Past due')
                    : subscription.status}
                </span>
              </div>
              <Link
                href={`/dashboard/billing?lang=${lang}`}
                className="inline-flex items-center text-sm font-medium transition-opacity hover:opacity-70 text-amber-600 dark:text-amber-400"
              >
                {lang === 'zh' ? '管理账单 →' : 'Manage billing →'}
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-4 text-gray-500 dark:text-gray-400">
                {lang === 'zh'
                  ? '升级为会员，解锁每日技术前瞻、播客纯享版等专属内容。'
                  : 'Upgrade to unlock daily tech briefings, podcast audio, and exclusive content.'}
              </p>
              <button
                onClick={() => handleUpgrade('pro')}
                disabled={checkoutLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50 bg-amber-600 text-white"
              >
                {checkoutLoading && <Loader2 size={14} className="animate-spin" />}
                {lang === 'zh' ? '升级为 Pro 会员' : 'Upgrade to Pro'}
              </button>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href={`/articles?lang=${lang}`}
            className="flex items-center gap-3 rounded-2xl border p-4 transition-opacity hover:opacity-80 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-900/20">
              <FileText size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {lang === 'zh' ? '浏览文章' : 'Browse articles'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {lang === 'zh' ? '发现精选内容' : 'Discover curated content'}
              </p>
            </div>
          </Link>

          <Link
            href={`/subscribe?lang=${lang}`}
            className="flex items-center gap-3 rounded-2xl border p-4 transition-opacity hover:opacity-80 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-green-50 dark:bg-green-900/20">
              <Mail size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {lang === 'zh' ? '邮件订阅' : 'Newsletter'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {lang === 'zh' ? '管理邮件推送偏好' : 'Manage email preferences'}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] dark:bg-[#1A1A1A]">
        <Loader2 className="animate-spin text-amber-600 dark:text-amber-400" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
