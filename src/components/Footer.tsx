import Link from 'next/link'

interface FooterProps {
  lang?: 'zh' | 'en'
}

export default function Footer({ lang = 'zh' }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className="mt-auto border-t"
      style={{ borderColor: '#E5E3DF', backgroundColor: '#FAFAF8' }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: '#D4830A' }}
              >
                J
              </span>
              <span className="font-semibold">John&apos;s Blog</span>
            </div>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              {lang === 'zh'
                ? '技术、生活与思考的记录地。'
                : 'Notes on technology, life, and ideas.'}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-medium text-sm mb-3">
              {lang === 'zh' ? '导航' : 'Navigation'}
            </h4>
            <ul className="space-y-2 text-sm" style={{ color: '#6B7280' }}>
              <li>
                <Link href={`/?lang=${lang}`} className="hover:opacity-70 transition-opacity">
                  {lang === 'zh' ? '首页' : 'Home'}
                </Link>
              </li>
              <li>
                <Link href={`/articles?lang=${lang}`} className="hover:opacity-70 transition-opacity">
                  {lang === 'zh' ? '文章' : 'Articles'}
                </Link>
              </li>
              <li>
                <Link href={`/subscribe?lang=${lang}`} className="hover:opacity-70 transition-opacity">
                  {lang === 'zh' ? '订阅' : 'Subscribe'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-medium text-sm mb-3">
              {lang === 'zh' ? '联系' : 'Contact'}
            </h4>
            <ul className="space-y-2 text-sm" style={{ color: '#6B7280' }}>
              <li>
                <a
                  href="https://github.com/weizy0219"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@johngai.com"
                  className="hover:opacity-70 transition-opacity"
                >
                  Email
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-8 pt-6 border-t text-sm text-center"
          style={{ borderColor: '#E5E3DF', color: '#6B7280' }}
        >
          © {currentYear} John Wei. {lang === 'zh' ? '保留所有权利。' : 'All rights reserved.'}
        </div>
      </div>
    </footer>
  )
}
