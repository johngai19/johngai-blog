'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Menu, X, Search } from 'lucide-react'
import AuthButton from './AuthButton'
import ThemeToggle from './ThemeToggle'

interface HeaderProps {
  lang?: 'zh' | 'en'
}

export default function Header({ lang = 'zh' }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const toggleLang = () => {
    const newLang = lang === 'zh' ? 'en' : 'zh'
    const params = new URLSearchParams(searchParams.toString())
    params.set('lang', newLang)
    router.push(`${pathname}?${params.toString()}`)
  }

  const navLinks = [
    { href: '/', label_zh: '首页', label_en: 'Home' },
    { href: '/articles', label_zh: '文章', label_en: 'Articles' },
    { href: '/subscribe', label_zh: '订阅', label_en: 'Subscribe' },
  ]

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: '#FAFAF8',
        borderColor: '#E5E3DF',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-lg tracking-tight"
            style={{ color: '#1A1A1A' }}
          >
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: '#D4830A' }}
            >
              J
            </span>
            <span className="hidden sm:block">John&apos;s Blog</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={`${link.href}?lang=${lang}`}
                className="text-sm transition-colors hover:opacity-60"
                style={{ color: pathname === link.href ? '#D4830A' : '#1A1A1A' }}
              >
                {lang === 'zh' ? link.label_zh : link.label_en}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Search */}
            <Link
              href={`/search?lang=${lang}`}
              className="p-1.5 rounded-lg transition-opacity hover:opacity-60"
              style={{ color: '#6B7280' }}
              aria-label={lang === 'zh' ? '搜索' : 'Search'}
            >
              <Search size={16} />
            </Link>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Auth button */}
            <AuthButton lang={lang} />

            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              style={{
                borderColor: '#E5E3DF',
                color: '#1A1A1A',
                backgroundColor: '#FFFFFF',
              }}
              aria-label="Switch language"
            >
              <span style={{ color: lang === 'zh' ? '#D4830A' : '#6B7280' }}>中</span>
              <span style={{ color: '#E5E3DF' }}>/</span>
              <span style={{ color: lang === 'en' ? '#D4830A' : '#6B7280' }}>EN</span>
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div
            className="md:hidden border-t py-3 space-y-1"
            style={{ borderColor: '#E5E3DF' }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={`${link.href}?lang=${lang}`}
                className="block px-2 py-2 text-sm rounded"
                style={{ color: '#1A1A1A' }}
                onClick={() => setMobileOpen(false)}
              >
                {lang === 'zh' ? link.label_zh : link.label_en}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
