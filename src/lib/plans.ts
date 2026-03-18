/**
 * Subscription plan configuration — safe for client-side import.
 * No Stripe SDK or server secrets here.
 */
export const PLANS = {
  pro: {
    name: 'Pro 会员',
    nameEn: 'Pro Member',
    price: 19,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID || '',
    features_zh: ['每日技术前瞻早报', '技术播客音频纯享版（早晚两期）', '无限文章访问', '优先邮件支持'],
    features_en: ['Daily tech briefing', 'Podcast audio (morning & evening)', 'Unlimited article access', 'Priority support'],
  },
  elite: {
    name: 'Elite 会员',
    nameEn: 'Elite Member',
    price: 199,
    priceId: process.env.NEXT_PUBLIC_STRIPE_ELITE_PRICE_ID || process.env.STRIPE_ELITE_PRICE_ID || '',
    features_zh: ['所有 Pro 权益', 'ailame AI 伴侣（即将推出）', '专属内容定制', '一对一咨询'],
    features_en: ['All Pro benefits', 'ailame AI companion (coming soon)', 'Custom content', '1-on-1 consultation'],
    comingSoon: true,
  },
} as const

export type PlanKey = keyof typeof PLANS
