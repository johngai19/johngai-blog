'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import AuthButton from './AuthButton'
import ThemeToggle from './ThemeToggle'
import SearchBar from './SearchBar'

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
    <header className="sticky top-0 z-50 border-b bg-[#FAFAF8] dark:bg-[#1A1A1A] border-[#E5E3DF] dark:border-[#333333] backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-lg tracking-tight text-[#1A1A1A] dark:text-[#E5E3DF]"
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
                style={{ color: pathname === link.href ? '#D4830A' : undefined }}
              >
                {pathname !== link.href && (
                  <span className="text-[#1A1A1A] dark:text-[#E5E3DF]">
                    {lang === 'zh' ? link.label_zh : link.label_en}
                  </span>
                )}
                {pathname === link.href && (lang === 'zh' ? link.label_zh : link.label_en)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Search bar — hidden on mobile (accessible via /search page) */}
            <div className="hidden sm:block">
              <SearchBar lang={lang} />
            </div>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Auth button */}
            <AuthButton lang={lang} />

            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors border-[#E5E3DF] dark:border-[#333333] bg-white dark:bg-[#2A2A2A] text-[#1A1A1A] dark:text-[#E5E3DF]"
              aria-label="Switch language"
            >
              <span style={{ color: lang === 'zh' ? '#D4830A' : '#6B7280' }}>中</span>
              <span className="text-[#E5E3DF] dark:text-[#555555]">/</span>
              <span style={{ color: lang === 'en' ? '#D4830A' : '#6B7280' }}>EN</span>
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-1 text-[#1A1A1A] dark:text-[#E5E3DF]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t py-3 space-y-1 border-[#E5E3DF] dark:border-[#333333]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={`${link.href}?lang=${lang}`}
                className="block px-2 py-2 text-sm rounded text-[#1A1A1A] dark:text-[#E5E3DF] hover:opacity-70"
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
