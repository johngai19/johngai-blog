'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PLANS } from '@/lib/plans'
import { Check, Loader2, Crown, Zap } from 'lucide-react'

function PricingContent() {
  const searchParams = useSearchParams()
  const lang = searchParams.get('lang') ?? 'zh'
  const [loading, setLoading] = useState(false)
  const canceled = searchParams.get('canceled') === '1'

  const handleCheckout = async (plan: 'pro' | 'elite') => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else if (data.error === 'Unauthorized') {
        window.location.href = `/login?lang=${lang}&next=/pricing`
      }
    } finally {
      setLoading(false)
    }
  }

  const freeFeatures_zh = ['每周精选文章', '基础内容访问', '邮件订阅（中文）']
  const freeFeatures_en = ['Weekly curated articles', 'Basic content access', 'Email newsletter']

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Nav bar */}
      <div className="border-b" style={{ borderColor: '#E5E3DF', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link href={`/?lang=${lang}`} className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
            ← {lang === 'zh' ? '返回首页' : 'Back'}
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-semibold mb-4" style={{ color: '#1A1A1A' }}>
            {lang === 'zh' ? '会员套餐' : 'Membership Plans'}
          </h1>
          <p className="text-lg max-w-xl mx-auto" style={{ color: '#6B7280' }}>
            {lang === 'zh'
              ? '选择适合你的套餐，解锁每日技术前瞻与深度内容。'
              : 'Choose the plan that fits you. Unlock daily briefings and in-depth content.'}
          </p>
          {canceled && (
            <p className="mt-4 text-sm" style={{ color: '#9CA3AF' }}>
              {lang === 'zh' ? '已取消结账，随时可以重新订阅。' : 'Checkout canceled. You can subscribe anytime.'}
            </p>
          )}
        </div>

        {/* Annual note */}
        <div
          className="text-center text-sm mb-8 py-2 px-4 rounded-full inline-block mx-auto"
          style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
        >
          <span className="flex items-center gap-1 justify-center">
            <Zap size={14} />
            {lang === 'zh' ? '年付享 9 折优惠（即将推出）' : 'Annual billing: 10% off (coming soon)'}
          </span>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {/* Free */}
          <div className="rounded-2xl border p-6 flex flex-col" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E3DF' }}>
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-1" style={{ color: '#1A1A1A' }}>
                {lang === 'zh' ? '免费' : 'Free'}
              </h2>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold" style={{ color: '#1A1A1A' }}>¥0</span>
                <span className="text-sm pb-1" style={{ color: '#9CA3AF' }}>/ {lang === 'zh' ? '月' : 'mo'}</span>
              </div>
            </div>
            <ul className="space-y-2 flex-1 mb-6">
              {(lang === 'zh' ? freeFeatures_zh : freeFeatures_en).map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#6B7280' }}>
                  <Check size={14} className="mt-0.5 shrink-0" style={{ color: '#9CA3AF' }} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={`/?lang=${lang}`}
              className="block text-center py-2.5 rounded-xl text-sm font-medium border transition-opacity hover:opacity-80"
              style={{ borderColor: '#E5E3DF', color: '#6B7280' }}
            >
              {lang === 'zh' ? '当前套餐' : 'Current plan'}
            </Link>
          </div>

          {/* Pro */}
          <div
            className="rounded-2xl border-2 p-6 flex flex-col relative"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#D4830A' }}
          >
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full text-white"
              style={{ backgroundColor: '#D4830A' }}
            >
              {lang === 'zh' ? '最受欢迎' : 'Most popular'}
            </div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-1.5" style={{ color: '#1A1A1A' }}>
                <Crown size={16} style={{ color: '#D4830A' }} />
                {PLANS.pro[lang === 'zh' ? 'name' : 'nameEn']}
              </h2>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold" style={{ color: '#1A1A1A' }}>¥{PLANS.pro.price}</span>
                <span className="text-sm pb-1" style={{ color: '#9CA3AF' }}>/ {lang === 'zh' ? '月' : 'mo'}</span>
              </div>
              <p className="text-xs mt-1" style={{ color: '#D4830A' }}>
                {lang === 'zh' ? '免费试用 14 天' : '14-day free trial'}
              </p>
            </div>
            <ul className="space-y-2 flex-1 mb-6">
              {(lang === 'zh' ? PLANS.pro.features_zh : PLANS.pro.features_en).map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#6B7280' }}>
                  <Check size={14} className="mt-0.5 shrink-0" style={{ color: '#D4830A' }} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('pro')}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: '#D4830A', color: '#FFFFFF' }}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {lang === 'zh' ? '免费试用 14 天' : 'Start 14-day trial'}
            </button>
          </div>

          {/* Elite */}
          <div
            className="rounded-2xl border p-6 flex flex-col relative opacity-70"
            style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E3DF' }}
          >
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: '#E5E3DF', color: '#6B7280' }}
            >
              {lang === 'zh' ? '即将推出' : 'Coming soon'}
            </div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-1.5" style={{ color: '#6B7280' }}>
                <Crown size={16} style={{ color: '#9CA3AF' }} />
                {PLANS.elite[lang === 'zh' ? 'name' : 'nameEn']}
              </h2>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold" style={{ color: '#6B7280' }}>¥{PLANS.elite.price}</span>
                <span className="text-sm pb-1" style={{ color: '#9CA3AF' }}>/ {lang === 'zh' ? '月' : 'mo'}</span>
              </div>
            </div>
            <ul className="space-y-2 flex-1 mb-6">
              {(lang === 'zh' ? PLANS.elite.features_zh : PLANS.elite.features_en).map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#9CA3AF' }}>
                  <Check size={14} className="mt-0.5 shrink-0" style={{ color: '#D1D5DB' }} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              disabled
              className="py-2.5 rounded-xl text-sm font-medium cursor-not-allowed"
              style={{ backgroundColor: '#E5E3DF', color: '#9CA3AF' }}
            >
              {lang === 'zh' ? '敬请期待' : 'Coming soon'}
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: '#1A1A1A' }}>
            {lang === 'zh' ? '常见问题' : 'FAQ'}
          </h2>
          <div className="space-y-4">
            {(lang === 'zh'
              ? [
                  { q: '如何取消订阅？', a: '随时可以通过账号中的账单管理页面取消，取消后在当前付费周期结束前仍可使用会员权益。' },
                  { q: '支持哪些支付方式？', a: '通过 Stripe 支持信用卡、借记卡等主流支付方式。' },
                  { q: '免费试用期结束后会怎样？', a: '试用期结束后自动按月扣费。你可以在试用期内随时取消，不产生任何费用。' },
                  { q: '发票和收据怎么获取？', a: '可以在账单管理门户中查看和下载所有历史发票。' },
                ]
              : [
                  { q: 'How do I cancel?', a: 'Cancel anytime from your billing page. You keep access until the end of your current period.' },
                  { q: 'What payment methods are accepted?', a: 'Credit/debit cards via Stripe.' },
                  { q: 'What happens after the free trial?', a: 'You are automatically charged monthly. Cancel anytime during the trial for no charge.' },
                  { q: 'How do I get invoices?', a: 'All invoices are available in the Stripe billing portal.' },
                ]
            ).map(({ q, a }) => (
              <div key={q} className="rounded-xl border p-4" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E3DF' }}>
                <p className="font-medium text-sm mb-1" style={{ color: '#1A1A1A' }}>{q}</p>
                <p className="text-sm" style={{ color: '#6B7280' }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }} />}>
      <PricingContent />
    </Suspense>
  )
}
