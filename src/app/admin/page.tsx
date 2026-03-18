import { createClient } from '@supabase/supabase-js'
import { FileText, Users, CreditCard, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getStats() {
  const [
    { count: totalArticles },
    { count: publishedArticles },
    { count: draftArticles },
    { count: emailSubscribers },
    { count: authUsers },
    { data: activeSubs },
    { data: recentSignups },
  ] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('email_subscribers').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('status', 'active'),
    supabase
      .from('profiles')
      .select('id, display_name, subscription_tier, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const proPlan = { price: 19 }
  const elitePlan = { price: 199 }
  const mrr = (activeSubs ?? []).reduce((sum, sub) => {
    if (sub.plan === 'pro') return sum + proPlan.price
    if (sub.plan === 'elite') return sum + elitePlan.price
    return sum
  }, 0)

  return {
    totalArticles: totalArticles ?? 0,
    publishedArticles: publishedArticles ?? 0,
    draftArticles: draftArticles ?? 0,
    emailSubscribers: emailSubscribers ?? 0,
    authUsers: authUsers ?? 0,
    activeSubscriptions: (activeSubs ?? []).length,
    mrr,
    recentSignups: recentSignups ?? [],
  }
}

export default async function AdminPage() {
  const stats = await getStats()

  const statCards = [
    {
      label: '已发布文章',
      value: stats.publishedArticles,
      sub: `${stats.draftArticles} 草稿`,
      icon: FileText,
      color: '#3B82F6',
      bg: '#EFF6FF',
    },
    {
      label: '邮件订阅者',
      value: stats.emailSubscribers,
      sub: `${stats.authUsers} 注册用户`,
      icon: Users,
      color: '#10B981',
      bg: '#ECFDF5',
    },
    {
      label: '活跃订阅',
      value: stats.activeSubscriptions,
      sub: '付费会员',
      icon: CreditCard,
      color: '#D4830A',
      bg: '#FEF3C7',
    },
    {
      label: '月收入 (MRR)',
      value: `¥${stats.mrr}`,
      sub: '预估月收入',
      icon: TrendingUp,
      color: '#8B5CF6',
      bg: '#F5F3FF',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>概览</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>博客运营数据</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-2xl border p-4"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E3DF' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent signups */}
      <div className="rounded-2xl border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E3DF' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: '#E5E3DF' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>最近注册用户</h2>
        </div>
        <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
          {stats.recentSignups.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center" style={{ color: '#9CA3AF' }}>暂无数据</p>
          ) : (
            stats.recentSignups.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
                    {u.display_name ?? '未命名用户'}
                  </p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    {new Date(u.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: u.subscription_tier !== 'free' ? '#FEF3C7' : '#F3F4F6',
                    color: u.subscription_tier !== 'free' ? '#D4830A' : '#6B7280',
                  }}
                >
                  {u.subscription_tier === 'free' ? '免费' : u.subscription_tier === 'pro' ? 'Pro' : 'Elite'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
