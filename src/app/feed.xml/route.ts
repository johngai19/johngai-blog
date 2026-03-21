import { getArticles } from '@/lib/articles'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const { articles } = await getArticles({ pageSize: 50 })
  const siteUrl = 'https://johngai.com'

  const items = articles
    .map((a) => {
      const title = a.title_zh || a.title_en || 'Untitled'
      const description = a.excerpt_zh || a.excerpt_en || ''
      const link = `${siteUrl}/articles/${a.slug}`
      const pubDate = a.published_at
        ? new Date(a.published_at).toUTCString()
        : new Date(a.created_at).toUTCString()

      return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>
      ${a.category ? `<category>${escapeXml(a.category)}</category>` : ''}
    </item>`
    })
    .join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>John's Blog</title>
    <link>${siteUrl}</link>
    <description>Technology, life, and ideas by John Wei</description>
    <language>zh-CN</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
