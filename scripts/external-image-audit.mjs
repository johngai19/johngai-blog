#!/usr/bin/env node
/**
 * Audit external images across all published articles.
 * Queries Supabase for all articles, extracts external image URLs from
 * content_zh, content_en, and cover_image fields, then categorizes by domain.
 *
 * Output: docs/external-image-inventory.md
 *
 * Usage: node scripts/external-image-audit.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repo = resolve(__dirname, '..')

// Load .env.local
const envText = readFileSync(resolve(repo, '.env.local'), 'utf-8')
const env = {}
for (const line of envText.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim()
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// Match markdown images ![alt](url) and HTML <img src="url">
const IMG_PATTERNS = [
  /!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g,
  /<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi,
]

function extractExternalImages(content) {
  if (!content) return []
  const urls = []
  for (const pattern of IMG_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match
    while ((match = regex.exec(content)) !== null) {
      urls.push(match[1])
    }
  }
  return urls
}

function getDomain(url) {
  try {
    return new URL(url).hostname
  } catch {
    return 'unknown'
  }
}

function getRiskLevel(domain) {
  // Own infrastructure: safe
  const ownDomains = [
    'supabase.co', 'johngai.com', 'www.johngai.com',
  ]
  // Low risk: major stable platforms
  const lowRisk = [
    'storage.googleapis.com', 'codelabs.developers.google.com',
    'upload.wikimedia.org', 'raw.githubusercontent.com',
    'github.com', 'i.imgur.com',
  ]
  // High risk: hotlink-protected or unstable
  const highRisk = [
    'pic1.zhimg.com', 'pic2.zhimg.com', 'pic3.zhimg.com', 'pic4.zhimg.com',
    'www.wesinx.com', 'wesinx.com',
  ]
  // Critical: likely expired
  const critical = [
    'omdmz8z30.bkt.clouddn.com',
  ]

  if (ownDomains.some(d => domain.includes(d))) return 'Own'
  if (critical.some(d => domain.includes(d))) return 'Critical'
  if (highRisk.some(d => domain.includes(d))) return 'High'
  if (lowRisk.some(d => domain.includes(d))) return 'Low'
  return 'Medium'
}

async function main() {
  console.log('External Image Audit')
  console.log('='.repeat(50))

  // Fetch all published articles in pages
  let allArticles = []
  let from = 0
  const PAGE = 1000

  while (true) {
    const { data, error } = await supabase
      .from('articles')
      .select('id, slug, title_en, title_zh, category, content_zh, content_en, cover_image')
      .eq('status', 'published')
      .range(from, from + PAGE - 1)

    if (error) {
      console.error('Fetch error:', error.message)
      break
    }
    allArticles = allArticles.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }

  console.log(`Fetched ${allArticles.length} published articles\n`)

  // Collect all external image references
  const articleImages = [] // { slug, title, category, urls: string[] }
  const domainMap = new Map() // domain -> { urls: Set, articles: Set, risk }
  let totalExternal = 0

  for (const article of allArticles) {
    const urls = new Set()

    // Check content fields
    for (const url of extractExternalImages(article.content_zh)) urls.add(url)
    for (const url of extractExternalImages(article.content_en)) urls.add(url)

    // Check cover_image (if external)
    if (article.cover_image && article.cover_image.startsWith('http')) {
      urls.add(article.cover_image)
    }

    if (urls.size === 0) continue

    const title = article.title_en || article.title_zh || article.slug
    articleImages.push({
      slug: article.slug,
      title,
      category: article.category || 'uncategorized',
      urls: [...urls],
    })
    totalExternal += urls.size

    for (const url of urls) {
      const domain = getDomain(url)
      if (!domainMap.has(domain)) {
        domainMap.set(domain, { urls: new Set(), articles: new Set(), risk: getRiskLevel(domain) })
      }
      domainMap.get(domain).urls.add(url)
      domainMap.get(domain).articles.add(article.slug)
    }
  }

  console.log(`Found ${totalExternal} external image URLs across ${articleImages.length} articles`)
  console.log(`Unique domains: ${domainMap.size}\n`)

  // Sort domains by URL count descending
  const sortedDomains = [...domainMap.entries()].sort((a, b) => b[1].urls.size - a[1].urls.size)

  // Generate markdown report
  const lines = []
  lines.push('# External Image Inventory')
  lines.push('')
  lines.push(`Generated: ${new Date().toISOString().slice(0, 10)}`)
  lines.push(`Total articles scanned: ${allArticles.length}`)
  lines.push(`Articles with external images: ${articleImages.length}`)
  lines.push(`Total external image URLs: ${totalExternal}`)
  lines.push(`Unique domains: ${domainMap.size}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  // Domain summary table
  lines.push('## Domain Summary')
  lines.push('')
  lines.push('| Domain | URLs | Articles | Risk |')
  lines.push('|--------|------|----------|------|')
  for (const [domain, info] of sortedDomains) {
    lines.push(`| ${domain} | ${info.urls.size} | ${info.articles.size} | ${info.risk} |`)
  }
  lines.push('')

  // Risk breakdown
  const riskGroups = { Critical: [], High: [], Medium: [], Low: [], Own: [] }
  for (const [domain, info] of sortedDomains) {
    riskGroups[info.risk].push({ domain, count: info.urls.size, articles: info.articles.size })
  }

  lines.push('## Risk Assessment')
  lines.push('')
  for (const [risk, domains] of Object.entries(riskGroups)) {
    if (domains.length === 0) continue
    const totalUrls = domains.reduce((s, d) => s + d.count, 0)
    lines.push(`### ${risk} Risk (${totalUrls} URLs)`)
    lines.push('')
    for (const d of domains) {
      lines.push(`- **${d.domain}**: ${d.count} URLs in ${d.articles} articles`)
    }
    lines.push('')
  }

  // Per-article detail
  lines.push('## Articles with External Images')
  lines.push('')

  // Sort by number of external images descending
  articleImages.sort((a, b) => b.urls.length - a.urls.length)

  for (const article of articleImages) {
    lines.push(`### ${article.title}`)
    lines.push(`- Slug: \`${article.slug}\``)
    lines.push(`- Category: ${article.category}`)
    lines.push(`- External images: ${article.urls.length}`)
    lines.push('')
    for (const url of article.urls) {
      const domain = getDomain(url)
      const risk = getRiskLevel(domain)
      lines.push(`  - [${risk}] \`${url}\``)
    }
    lines.push('')
  }

  // Recommended actions
  lines.push('## Recommended Actions')
  lines.push('')
  lines.push('1. **Critical**: Migrate Qiniu CDN images immediately (likely already broken)')
  lines.push('2. **High**: Backup Zhihu (zhimg.com) images -- hotlink protection active')
  lines.push('3. **High**: Backup wesinx.com images -- company site may change')
  lines.push('4. **Medium**: Monitor third-party project sites')
  lines.push('5. **Low**: Google/Wikimedia hosted images are stable, low priority')
  lines.push('')

  const report = lines.join('\n')
  const outPath = resolve(repo, 'docs', 'external-image-inventory.md')
  writeFileSync(outPath, report)
  console.log(`Report written to: ${outPath}`)
}

main().catch(e => { console.error(e); process.exit(1) })
