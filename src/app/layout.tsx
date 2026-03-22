import type { Metadata } from 'next'
import { Inter, Noto_Serif_SC } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: "John's Blog · 约翰的博客",
    template: "%s · John's Blog",
  },
  description:
    "John Wei's personal blog on technology, life, and ideas. 约翰·魏的个人博客，分享技术、生活与思考。",
  metadataBase: new URL('https://johngai.com'),
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
    siteName: "John's Blog",
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" className={`${inter.variable} ${notoSerifSC.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="alternate" type="application/rss+xml" title="John's Blog" href="/feed.xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t==null&&matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className="antialiased min-h-screen flex flex-col bg-[#FAFAF8] text-[#1A1A1A] dark:bg-[#1A1A1A] dark:text-[#E5E3DF]"
        style={{
          fontFamily: "var(--font-inter), 'Noto Serif SC', system-ui, sans-serif",
        }}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
