'use client'

import { useState, useEffect } from 'react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { EmailSubscriber } from '@/types'
import { Download, Crown, Mail } from 'lucide-react'

interface Profile {
  id: string
  display_name: string | null
  subscription_tier: string
  stripe_customer_id: string | null
  created_at: string
}

type TabType = 'email' | 'auth'

export default function AdminSubscribersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('email')
  const [emailSubs, setEmailSubs] = useState<EmailSubscriber[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const [{ data: emailData }, { data: profileData }] = await Promise.all([
        supabase.from('email_subscribers').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      ])
      setEmailSubs((emailData as EmailSubscriber[]) ?? [])
      setProfiles((profileData as Profile[]) ?? [])
      setLoading(false)
    }
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const exportCSV = () => {
    const rows =
      activeTab === 'email'
        ? [
            ['邮箱', '状态', '语言', '注册时间'],
            ...emailSubs.map((s) => [
              s.email,
              s.confirmed ? '已确认' : '未确认',
              s.language,
              new Date(s.created_at).toLocaleDateString('zh-CN'),
            ]),
          ]
        : [
            ['ID', '显示名', '订阅等级', '注册时间'],
            ...profiles.map((p) => [
              p.id,
              p.display_name ?? '',
              p.subscription_tier,
              new Date(p.created_at).toLocaleDateString('zh-CN'),
            ]),
          ]

    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab}-subscribers-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>订阅者管理</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
            {emailSubs.length} 邮件订阅 · {profiles.length} 注册用户
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-opacity hover:opacity-70"
          style={{ borderColor: '#E5E3DF', color: '#6B7280', backgroundColor: '#FFFFFF' }}
        >
          <Download size={13} />
          导出 CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: '#F3F4F6' }}>
        {([
          { id: 'email' as const, label: '邮件订阅', icon: Mail },
          { id: 'auth' as const, label: '注册用户', icon: Crown },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: activeTab === id ? '#FFFFFF' : 'transparent',
              color: activeTab === id ? '#1A1A1A' : '#6B7280',
              boxShadow: activeTab === id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E3DF' }}>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: '#9CA3AF' }}>加载中…</div>
        ) : activeTab === 'email' ? (
          emailSubs.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: '#9CA3AF' }}>暂无邮件订阅者</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: '#6B7280' }}>邮箱</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell" style={{ color: '#6B7280' }}>状态</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell" style={{ color: '#6B7280' }}>语言</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell" style={{ color: '#6B7280' }}>注册时间</th>
                </tr>
              </thead>
              <tbody>
                {emailSubs.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid #F9FAFB' }} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium" style={{ color: '#1A1A1A' }}>{sub.email}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: sub.confirmed ? '#F0FDF4' : '#FEF3C7',
                          color: sub.confirmed ? '#16A34A' : '#92400E',
                        }}
                      >
                        {sub.confirmed ? '已确认' : '待确认'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs" style={{ color: '#6B7280' }}>
                        {sub.language === 'zh' ? '中文' : sub.language === 'en' ? '英文' : '双语'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>
                        {new Date(sub.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : profiles.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: '#9CA3AF' }}>暂无注册用户</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                <th className="px-4 py-3 text-left font-medium" style={{ color: '#6B7280' }}>用户</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell" style={{ color: '#6B7280' }}>会员等级</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell" style={{ color: '#6B7280' }}>注册时间</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} style={{ borderBottom: '1px solid #F9FAFB' }} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: '#1A1A1A' }}>
                      {profile.display_name ?? '未命名用户'}
                    </p>
                    <p className="text-xs font-mono" style={{ color: '#9CA3AF' }}>
                      {profile.id.substring(0, 8)}…
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: profile.subscription_tier !== 'free' ? '#FEF3C7' : '#F3F4F6',
                        color: profile.subscription_tier !== 'free' ? '#D4830A' : '#6B7280',
                      }}
                    >
                      {profile.subscription_tier !== 'free' && <Crown size={9} />}
                      {profile.subscription_tier === 'free' ? '免费' : profile.subscription_tier === 'pro' ? 'Pro' : 'Elite'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>
                      {new Date(profile.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
