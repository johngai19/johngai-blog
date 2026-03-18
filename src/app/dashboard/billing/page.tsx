'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { PLANS } from '@/lib/stripe'
import type { User } from '@supabase/supabase-js'
import { CreditCard, ArrowLeft, Loader2, ExternalLink, AlertCircle } from 'lucide-react'

interface Profile {
  subscription_tier: string
  stripe_customer_id: string | null
}

interface Subscription {
  id: string
  plan: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_subscription_id: string | null
}

function BillingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const lang = searchParams.get('lang') ?? 'zh'

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/login?lang=${lang}`)
      return
    }
    setUser(user)

    const [{ data: profileData }, { data: subData }] = await Promise.all([
      supabase.from('profiles').select('subscription_tier, stripe_customer_id').eq('id', user.id).single(),
      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
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

  const openPortal = async () => {
    setPortalLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Unknown error')
      }
    } catch {
      setError('Failed to open billing portal')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
        <Loader2 className="animate-spin" style={{ color: '#D4830A' }} />
      </div>
    )
  }

  const tier = profile?.subscription_tier ?? 'free'
  const planName = tier === 'pro'
    ? PLANS.pro[lang === 'zh' ? 'name' : 'nameEn']
    : tier === 'elite'
    ? PLANS.elite[lang === 'zh' ? 'name' : 'nameEn']
    : (lang === 'zh' ? '免费' : 'Free')

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US') : '—'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="border-b" style={{ borderColor: '#E5E3DF', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href={`/dashboard?lang=${lang}`}
            className="inline-flex items-center gap-1 text-sm transition-opacity hover:opacity-60"
            style={{ color: '#6B7280' }}
          >
            <ArrowLeft size={14} />
            {lang === 'zh' ? '返回账号' : 'Back to dashboard'}
          </Link>
          <span className="text-sm font-medium" style={{ color: '#6B7280' }}>
            {lang === 'zh' ? '账单管理' : 'Billing'}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Current plan */}
        <div className="rounded-2xl border p-6" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E3DF' }}>
          <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1A1A1A' }}>
            <CreditCard size={16} />
            {lang === 'zh' ? '当前套餐' : 'Current Plan'}
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: '#6B7280' }}>{lang === 'zh' ? '套餐' : 'Plan'}</span>
              <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{planName}</span>
            </div>

            {subscription && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#6B7280' }}>{lang === 'zh' ? '状态' : 'Status'}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: ['active', 'trialing'].includes(subscription.status) ? '#F0FDF4' : '#FEF2F2',
                      color: ['active', 'trialing'].includes(subscription.status) ? '#16A34A' : '#DC2626',
                    }}
                  >
                    {subscription.status === 'active' ? (lang === 'zh' ? '正常' : 'Active')
                      : subscription.status === 'trialing' ? (lang === 'zh' ? '试用中' : 'Trialing')
                      : subscription.status === 'canceled' ? (lang === 'zh' ? '已取消' : 'Canceled')
                      : subscription.status === 'past_due' ? (lang === 'zh' ? '欠费' : 'Past due')
                      : subscription.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#6B7280' }}>{lang === 'zh' ? '当前周期' : 'Current period'}</span>
                  <span className="text-sm" style={{ color: '#1A1A1A' }}>
                    {formatDate(subscription.current_period_start)} – {formatDate(subscription.current_period_end)}
                  </span>
                </div>
                {subscription.cancel_at_period_end && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-lg text-sm"
                    style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                  >
                    <AlertCircle size={14} />
                    {lang === 'zh'
                      ? `订阅将在 ${formatDate(subscription.current_period_end)} 到期后自动取消`
                      : `Subscription will cancel on ${formatDate(subscription.current_period_end)}`}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stripe portal */}
        {profile?.stripe_customer_id && (
          <div className="rounded-2xl border p-6" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E3DF' }}>
            <h2 className="font-semibold mb-2" style={{ color: '#1A1A1A' }}>
              {lang === 'zh' ? '自助账单管理' : 'Self-service Billing'}
            </h2>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
              {lang === 'zh'
                ? '通过 Stripe 客户门户更新支付方式、查看历史发票或取消订阅。'
                : 'Update payment method, view invoices, or cancel your subscription via Stripe.'}
            </p>
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}
            >
              {portalLoading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
              {lang === 'zh' ? '打开账单门户' : 'Open billing portal'}
            </button>
          </div>
        )}

        {/* No subscription */}
        {!subscription && (
          <div className="rounded-2xl border p-6 text-center" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E3DF' }}>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
              {lang === 'zh' ? '暂无有效订阅。' : 'No active subscription.'}
            </p>
            <Link
              href={`/pricing?lang=${lang}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#D4830A', color: '#FFFFFF' }}
            >
              {lang === 'zh' ? '查看会员套餐' : 'View pricing'}
            </Link>
          </div>
        )}

        <p className="text-xs text-center" style={{ color: '#9CA3AF' }}>
          {lang === 'zh'
            ? `当前登录账号：${user?.email}`
            : `Signed in as: ${user?.email}`}
        </p>
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
        <Loader2 className="animate-spin" style={{ color: '#D4830A' }} />
      </div>
    }>
      <BillingContent />
    </Suspense>
  )
}
