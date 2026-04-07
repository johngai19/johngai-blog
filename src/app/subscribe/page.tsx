import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SubscribeForm from '@/components/SubscribeForm'
import { Mail, BookOpen, Bell } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Subscribe - John\'s Blog',
  description: 'Subscribe to receive new articles from John Wei. Get notified when new posts are published.',
  alternates: {
    canonical: 'https://www.johngai.com/subscribe',
  },
}

interface SubscribePageProps {
  searchParams: Promise<{ lang?: string }>
}

export default async function SubscribePage({ searchParams }: SubscribePageProps) {
  const params = await searchParams
  const lang = (params.lang === 'zh' ? 'zh' : 'en') as 'zh' | 'en'

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
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5 bg-amber-100 dark:bg-amber-900/30">
                <Mail size={24} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                {lang === 'zh' ? '订阅更新' : 'Stay Updated'}
              </h1>
              <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                {lang === 'zh'
                  ? '输入您的邮箱，当有新文章发布时我们会发邮件通知您。'
                  : 'Enter your email and we\'ll notify you when new articles are published.'}
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-10">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 bg-amber-100 dark:bg-amber-900/30">
                    <f.icon size={14} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-sm pt-1.5 text-gray-500 dark:text-gray-400">
                    {lang === 'zh' ? f.zh : f.en}
                  </p>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
              <SubscribeForm lang={lang} />
            </div>

            <p className="text-xs text-center mt-5 text-gray-400 dark:text-gray-500">
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
