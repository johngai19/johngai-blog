import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import Link from 'next/link'
import { LayoutDashboard, FileText, Users, Image as ImageIcon, Mail } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getAdminUser() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser()

  if (!user) {
    redirect('/login')
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail && user.email !== adminEmail) {
    redirect('/')
  }

  const navItems = [
    { href: '/admin', label: '概览', icon: LayoutDashboard },
    { href: '/admin/articles', label: '文章', icon: FileText },
    { href: '/admin/media', label: '媒体库', icon: ImageIcon },
    { href: '/admin/subscribers', label: '订阅者', icon: Users },
    { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
  ]

  return (
    <div className="min-h-screen flex bg-[#FAFAF8] dark:bg-[#1A1A1A]">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r flex flex-col bg-white dark:bg-[#242424] border-[#E5E3DF] dark:border-[#333333]">
        <div className="p-4 border-b border-[#E5E3DF] dark:border-[#333333]">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: '#D4830A' }}
            >
              J
            </div>
            <span className="text-sm font-semibold text-[#1A1A1A] dark:text-[#E5E3DF]">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:opacity-70 text-[#1A1A1A] dark:text-[#E5E3DF] hover:bg-gray-100 dark:hover:bg-[#2A2A2A]"
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-[#E5E3DF] dark:border-[#333333]">
          <p className="text-xs truncate text-[#9CA3AF]">{user.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
