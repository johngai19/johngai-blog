'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { LogOut, LayoutDashboard, ChevronDown } from 'lucide-react'

interface AuthButtonProps {
  lang?: 'zh' | 'en'
}

export default function AuthButton({ lang = 'zh' }: AuthButtonProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setOpen(false)
    router.push(`/?lang=${lang}`)
    router.refresh()
  }

  if (loading) {
    return <div className="w-8 h-8 rounded-full animate-pulse" style={{ backgroundColor: '#E5E3DF' }} />
  }

  if (!user) {
    return (
      <Link
        href={`/login?lang=${lang}`}
        className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:opacity-80"
        style={{
          borderColor: '#E5E3DF',
          color: '#1A1A1A',
          backgroundColor: '#FFFFFF',
        }}
      >
        {lang === 'zh' ? '登录' : 'Login'}
      </Link>
    )
  }

  const displayName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User'
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-opacity hover:opacity-80"
        style={{ borderColor: '#E5E3DF', backgroundColor: '#FFFFFF', color: '#1A1A1A' }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={displayName} className="w-5 h-5 rounded-full object-cover" />
        ) : (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: '#D4830A' }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hidden sm:block max-w-20 truncate">{displayName}</span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-44 rounded-xl shadow-lg border py-1 z-50"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E3DF' }}
        >
          <Link
            href={`/dashboard?lang=${lang}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:opacity-60"
            style={{ color: '#1A1A1A' }}
          >
            <LayoutDashboard size={14} />
            {lang === 'zh' ? '我的账号' : 'Dashboard'}
          </Link>
          <div className="my-1 h-px" style={{ backgroundColor: '#E5E3DF' }} />
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:opacity-60"
            style={{ color: '#6B7280' }}
          >
            <LogOut size={14} />
            {lang === 'zh' ? '退出登录' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  )
}
