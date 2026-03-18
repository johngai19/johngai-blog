import type { Metadata } from 'next'
import { Inter, Noto_Serif_SC } from 'next/font/google'
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
      </head>
      <body
        className="antialiased min-h-screen flex flex-col"
        style={{
          fontFamily: "var(--font-inter), 'Noto Serif SC', system-ui, sans-serif",
          backgroundColor: '#FAFAF8',
          color: '#1A1A1A',
        }}
      >
        {children}
      </body>
    </html>
  )
}
