import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SubscribeForm from '@/components/SubscribeForm'
import { Mail, BookOpen, Bell } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Subscribe',
  description: 'Subscribe to receive new articles from John Wei.',
}

interface SubscribePageProps {
  searchParams: Promise<{ lang?: string }>
}

export default async function SubscribePage({ searchParams }: SubscribePageProps) {
  const params = await searchParams
  const lang = (params.lang === 'en' ? 'en' : 'zh') as 'zh' | 'en'

  const features = [
    {
      icon: Bell,
      zh: '新文章发布时第一时间通知',
      en: 'First to know when new posts go live',
    },
    {
      icon: BookOpen,
      zh: '中英文内容，按您偏好推送',
      en: 'Chinese or English content, your choice',
    },
    {
      icon: Mail,
      zh: '不频繁，不骚扰，随时可取消',
      en: 'Infrequent, no spam, unsubscribe anytime',
    },
  ]

  return (
    <>
      <Header lang={lang} />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-lg mx-auto">
            {/* Hero text */}
            <div className="text-center mb-10">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5"
                style={{ backgroundColor: '#F5E6C8' }}
              >
                <Mail size={24} style={{ color: '#D4830A' }} />
              </div>
              <h1 className="text-3xl font-bold mb-3" style={{ color: '#1A1A1A' }}>
                {lang === 'zh' ? '订阅更新' : 'Stay Updated'}
              </h1>
              <p className="text-base leading-relaxed" style={{ color: '#6B7280' }}>
                {lang === 'zh'
                  ? '输入您的邮箱，当有新文章发布时我们会发邮件通知您。'
                  : 'Enter your email and we\'ll notify you when new articles are published.'}
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-10">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: '#F5E6C8' }}
                  >
                    <f.icon size={14} style={{ color: '#D4830A' }} />
                  </div>
                  <p className="text-sm pt-1.5" style={{ color: '#6B7280' }}>
                    {lang === 'zh' ? f.zh : f.en}
                  </p>
                </div>
              ))}
            </div>

            {/* Form */}
            <div
              className="p-6 rounded-2xl border"
              style={{ borderColor: '#E5E3DF', backgroundColor: '#FFFFFF' }}
            >
              <SubscribeForm lang={lang} />
            </div>

            <p className="text-xs text-center mt-5" style={{ color: '#9CA3AF' }}>
              {lang === 'zh'
                ? '我们不会向第三方分享您的邮箱地址。'
                : 'We will never share your email with third parties.'}
            </p>
          </div>
        </div>
      </main>
      <Footer lang={lang} />
    </>
  )
}
