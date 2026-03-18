'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { PLANS } from '@/lib/stripe'
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
        <Loader2 className="animate-spin" style={{ color: '#D4830A' }} />
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
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Header bar */}
      <div className="border-b" style={{ borderColor: '#E5E3DF', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href={`/?lang=${lang}`} className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>
            ← {lang === 'zh' ? '返回首页' : 'Back to site'}
          </Link>
          <span className="text-sm font-medium" style={{ color: '#6B7280' }}>
            {lang === 'zh' ? '个人账号' : 'Dashboard'}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {success && (
          <div className="flex items-center gap-2 p-4 rounded-xl text-sm" style={{ backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
            <CheckCircle size={16} />
            {lang === 'zh' ? '订阅成功！欢迎加入会员。' : 'Subscription successful! Welcome aboard.'}
          </div>
        )}

        {/* Profile card */}
        <div className="rounded-2xl border p-6" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E3DF' }}>
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: '#D4830A' }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>{displayName}</h1>
              <p className="text-sm" style={{ color: '#6B7280' }}>{user?.email}</p>
              <span
                className="inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: tier !== 'free' ? '#FEF3C7' : '#F3F4F6',
                  color: tier !== 'free' ? '#D4830A' : '#6B7280',
                }}
              >
                {tier !== 'free' && <Crown size={10} />}
                {planLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription card */}
        <div className="rounded-2xl border p-6" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E3DF' }}>
          <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1A1A1A' }}>
            <CreditCard size={16} />
            {lang === 'zh' ? '订阅状态' : 'Subscription'}
          </h2>

          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium" style={{ color: '#1A1A1A' }}>
                    {subscription.plan === 'pro' ? PLANS.pro[lang === 'zh' ? 'name' : 'nameEn'] : PLANS.elite[lang === 'zh' ? 'name' : 'nameEn']}
                  </p>
                  <p className="text-sm" style={{ color: '#6B7280' }}>
                    {subscription.cancel_at_period_end
                      ? (lang === 'zh' ? '将在当前周期结束时取消' : 'Cancels at period end')
                      : (lang === 'zh' ? '自动续费' : 'Auto-renews')}
                    {subscription.current_period_end && (
                      <> · {new Date(subscription.current_period_end).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')}</>
                    )}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: subscription.status === 'active' ? '#F0FDF4' : '#FEF2F2',
                    color: subscription.status === 'active' ? '#16A34A' : '#DC2626',
                  }}
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
                className="inline-flex items-center text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: '#D4830A' }}
              >
                {lang === 'zh' ? '管理账单 →' : 'Manage billing →'}
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
                {lang === 'zh'
                  ? '升级为会员，解锁每日技术前瞻、播客纯享版等专属内容。'
                  : 'Upgrade to unlock daily tech briefings, podcast audio, and exclusive content.'}
              </p>
              <button
                onClick={() => handleUpgrade('pro')}
                disabled={checkoutLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: '#D4830A', color: '#FFFFFF' }}
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
            className="flex items-center gap-3 rounded-2xl border p-4 transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E3DF' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
              <FileText size={16} style={{ color: '#D4830A' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
                {lang === 'zh' ? '浏览文章' : 'Browse articles'}
              </p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                {lang === 'zh' ? '发现精选内容' : 'Discover curated content'}
              </p>
            </div>
          </Link>

          <Link
            href={`/subscribe?lang=${lang}`}
            className="flex items-center gap-3 rounded-2xl border p-4 transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E3DF' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F0FDF4' }}>
              <Mail size={16} style={{ color: '#16A34A' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
                {lang === 'zh' ? '邮件订阅' : 'Newsletter'}
              </p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
        <Loader2 className="animate-spin" style={{ color: '#D4830A' }} />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
