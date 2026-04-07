/**
 * Recategorize articles — analyze "writing" catch-all and propose better categories.
 *
 * Proposed taxonomy (expanding from 7 to 10 categories):
 *   existing:  engineering, industry, books, life, startup, writing, "AI Deep Dive"
 *   new:       zhihu-qa, tech-tutorial, opinion  (split from "writing")
 *   writing stays for: poetry, literary essays, creative writing
 *
 * Usage:
 *   node scripts/recategorize-articles.mjs --dry-run              # analyze and report (default)
 *   node scripts/recategorize-articles.mjs --dry-run --limit 50   # analyze first 50
 *   node scripts/recategorize-articles.mjs --apply                # apply changes to Supabase
 *   node scripts/recategorize-articles.mjs --apply --limit 50     # apply to first 50
 *   node scripts/recategorize-articles.mjs --stats                # show current distribution only
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Load env ──────────────────────────────────────────────────────────────
const envPath = resolve(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim()
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// ── CLI args ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const mode = args.includes('--apply') ? 'apply' : args.includes('--stats') ? 'stats' : 'dry-run'
const limitIdx = args.indexOf('--limit')
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : null

// ── Proposed taxonomy ─────────────────────────────────────────────────────
//
// The "writing" category (1240 articles, 77% of total) actually contains:
//
//   1. zhihu-qa      (~832, 67%)  — Zhihu Q&A reposts, title starts with [回答]/[想法]
//   2. tech-tutorial  (~80, 6%)   — How-to guides, install/config articles
//   3. book-review    (~50, 4%)   — Reviews with 《》book titles, 书评/读后感 tags
//   4. industry       (~30, 2%)   — Industrial solutions, IoT, energy systems
//   5. opinion        (~40, 3%)   — Commentary on current events, social topics
//   6. personal-essay (~20, 2%)   — Life reflections, parenting, personal stories → "life"
//   7. writing        (remainder) — Literary essays, poetry, creative pieces (keep)
//
// Mapping to final categories:
//   zhihu-qa      → new "zhihu-qa" category
//   tech-tutorial → existing "engineering"
//   book-review   → existing "books"
//   industry sol. → existing "industry"
//   opinion       → new "opinion" category
//   personal      → existing "life"
//   writing       → keep as "writing"

/**
 * Classify a single article based on title, tags, and content hints.
 * Returns { newCategory, reason } or null if no change needed.
 */
function classifyArticle(article) {
  const titleZh = article.title_zh || ''
  const titleEn = article.title_en || ''
  const tags = (article.tags || []).map(t => t.toLowerCase())
  const tagsStr = tags.join(' ')
  const contentZh = (article.content_zh || '').slice(0, 500) // first 500 chars for hints

  // Only reclassify "writing" articles
  if (article.category !== 'writing') return null

  // ── Rule 1: Zhihu Q&A ──────────────────────────────────────────────────
  // Strongest signal: title prefix [回答] or [想法]
  if (/^\[回答\]/.test(titleZh) || /^\[想法\]/.test(titleZh) ||
      /^\[Answer\]/i.test(titleEn) || /^\[Thought\]/i.test(titleEn)) {
    return { newCategory: 'zhihu-qa', reason: 'Zhihu Q&A repost (title prefix)' }
  }

  // ── Rule 2: Book reviews ───────────────────────────────────────────────
  // Tags: 书评, 读后感, 读书笔记, book-review
  if (tags.some(t => /书评|读后感|读书笔记|book.?review/.test(t))) {
    return { newCategory: 'books', reason: 'Book review (tag match)' }
  }
  // Title with 《book》 + review keywords
  if (/《.+》/.test(titleZh) && /读|书评|笔记|评|摘|review|reading/i.test(titleZh + ' ' + tagsStr)) {
    return { newCategory: 'books', reason: 'Book review (title + keywords)' }
  }

  // ── Rule 3: Tech tutorials ─────────────────────────────────────────────
  const techPatterns = /安装|配置|如何.*下载|部署|搭建|开发环境|源码分析|编程软件|入门学习/
  const techTitleEn = /how.?to|install|configur|tutorial|setup|getting.?started|step.?by.?step/i
  const techTopics = /docker|nginx|linux|ubuntu|python|wordpress|flask|node\.?js|nestjs|react|vue|git|WSL|群晖|TDMS|Modbus|WebSocket|API|SDK|MySQL|PostgreSQL|MongoDB|Redis|kubernetes|k8s|terraform|ansible/i
  if (techPatterns.test(titleZh) || techTitleEn.test(titleEn) || techTopics.test(titleZh + ' ' + titleEn)) {
    return { newCategory: 'engineering', reason: 'Tech tutorial/guide' }
  }

  // ── Rule 4: Industry solutions ─────────────────────────────────────────
  const industryPatterns = /解决方案|SEMS|项目案例|工业互联网|智慧能源|物联网|IoT|自动化.*系统|分布式能源|节能策略|数据中心|电力.*系统|变电站|PLC|SCADA|工控|工业.*控制/i
  if (industryPatterns.test(titleZh + ' ' + titleEn)) {
    return { newCategory: 'industry', reason: 'Industry/IoT/energy content' }
  }

  // ── Rule 5: Opinion / commentary ───────────────────────────────────────
  // "如何看待..." pattern (opinion on current events, not Zhihu [回答] format)
  if (/^如何看待|^如何评价|^怎么看待/.test(titleZh)) {
    return { newCategory: 'opinion', reason: 'Opinion/commentary (如何看待 pattern)' }
  }
  // Current events commentary
  if (/评论|观点|如何评价|争议|反思.*事件/i.test(titleZh) && !/技术|编程|代码/.test(titleZh)) {
    return { newCategory: 'opinion', reason: 'Opinion/commentary piece' }
  }

  // ── Rule 6: Personal essays / life reflections ─────────────────────────
  const lifePatterns = /焦虑的父母|育儿|孩子.*教育|让孩子|亲子/i
  if (lifePatterns.test(titleZh)) {
    return { newCategory: 'life', reason: 'Parenting/education content' }
  }
  if (/感悟|随笔|人生|如果.*消失|关于跑步|生活.*美好|回忆|记忆|成长|相遇|告别|思念/i.test(titleZh) &&
      !/技术|编程|工业|能源|自动化/.test(titleZh)) {
    return { newCategory: 'life', reason: 'Personal essay/life reflection' }
  }

  // ── Rule 7: Book-titled articles (《》 without review keywords) ────────
  // These are likely book reviews or reading notes even without explicit keywords
  if (/^《.+》/.test(titleZh) || /《.+》.*书/.test(titleZh)) {
    return { newCategory: 'books', reason: 'Book-titled article (likely review/notes)' }
  }

  // ── No match: keep as writing ──────────────────────────────────────────
  return null
}

// ── Fetch all articles ────────────────────────────────────────────────────
async function fetchAllArticles(categoryFilter = null) {
  const all = []
  let from = 0
  while (true) {
    let query = supabase.from('articles').select('id, title_zh, title_en, tags, category, slug')
    if (categoryFilter) query = query.eq('category', categoryFilter)
    const { data, error } = await query.range(from, from + 999)
    if (error) { console.error('Fetch error:', error); process.exit(1) }
    all.push(...data)
    if (data.length < 1000) break
    from += 1000
  }
  return all
}

// ── Stats mode ────────────────────────────────────────────────────────────
async function showStats() {
  const all = await fetchAllArticles()
  const counts = {}
  all.forEach(a => { counts[a.category || 'null'] = (counts[a.category || 'null'] || 0) + 1 })

  console.log('\n=== CURRENT CATEGORY DISTRIBUTION ===')
  console.log(`Total articles: ${all.length}\n`)
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const pct = ((count / all.length) * 100).toFixed(1)
      const bar = '█'.repeat(Math.round(count / all.length * 50))
      console.log(`  ${cat.padEnd(15)} ${String(count).padStart(5)}  (${pct.padStart(5)}%)  ${bar}`)
    })
}

// ── Dry-run / Apply mode ──────────────────────────────────────────────────
async function recategorize() {
  console.log(`\nMode: ${mode.toUpperCase()}`)
  if (limit) console.log(`Limit: ${limit} articles`)

  let articles = await fetchAllArticles('writing')
  console.log(`\nFetched ${articles.length} "writing" articles`)

  if (limit) articles = articles.slice(0, limit)
  console.log(`Analyzing ${articles.length} articles...\n`)

  const changes = []
  const kept = []

  for (const article of articles) {
    const result = classifyArticle(article)
    if (result) {
      changes.push({ ...article, ...result })
    } else {
      kept.push(article)
    }
  }

  // Summary by new category
  const changeCounts = {}
  changes.forEach(c => {
    changeCounts[c.newCategory] = (changeCounts[c.newCategory] || 0) + 1
  })

  console.log('=== RECATEGORIZATION SUMMARY ===')
  console.log(`  Analyzed:    ${articles.length}`)
  console.log(`  To change:   ${changes.length} (${((changes.length / articles.length) * 100).toFixed(1)}%)`)
  console.log(`  Keep writing: ${kept.length} (${((kept.length / articles.length) * 100).toFixed(1)}%)\n`)

  console.log('  Changes by target category:')
  Object.entries(changeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`    writing → ${cat.padEnd(15)} ${count}`)
    })

  // Show samples per category
  console.log('\n=== SAMPLE CHANGES ===')
  const byCategory = {}
  changes.forEach(c => {
    if (!byCategory[c.newCategory]) byCategory[c.newCategory] = []
    byCategory[c.newCategory].push(c)
  })

  for (const [cat, items] of Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n  ── ${cat} (${items.length} articles) ──`)
    items.slice(0, 5).forEach(item => {
      console.log(`    ${item.title_zh?.slice(0, 60) || item.title_en?.slice(0, 60)}`)
      console.log(`      reason: ${item.reason}`)
    })
    if (items.length > 5) console.log(`    ... and ${items.length - 5} more`)
  }

  // Show what stays as "writing"
  console.log(`\n  ── kept as "writing" (${kept.length} articles) ──`)
  kept.slice(0, 8).forEach(item => {
    console.log(`    ${item.title_zh?.slice(0, 60) || item.title_en?.slice(0, 60)}`)
  })
  if (kept.length > 8) console.log(`    ... and ${kept.length - 8} more`)

  // Projected distribution
  if (!limit) {
    const allArticles = await fetchAllArticles()
    const projected = {}
    allArticles.forEach(a => { projected[a.category || 'null'] = (projected[a.category || 'null'] || 0) + 1 })
    // Apply changes to projection
    changes.forEach(c => {
      projected['writing']--
      projected[c.newCategory] = (projected[c.newCategory] || 0) + 1
    })

    console.log('\n=== PROJECTED DISTRIBUTION (after apply) ===')
    console.log(`Total: ${allArticles.length}\n`)
    Object.entries(projected)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        const pct = ((count / allArticles.length) * 100).toFixed(1)
        const bar = '█'.repeat(Math.round(count / allArticles.length * 50))
        console.log(`  ${cat.padEnd(15)} ${String(count).padStart(5)}  (${pct.padStart(5)}%)  ${bar}`)
      })
  }

  // Apply mode
  if (mode === 'apply') {
    console.log(`\n=== APPLYING ${changes.length} CHANGES ===`)
    let success = 0, failed = 0

    for (const change of changes) {
      const { error } = await supabase
        .from('articles')
        .update({ category: change.newCategory })
        .eq('id', change.id)

      if (error) {
        console.error(`  FAIL: ${change.slug} → ${change.newCategory}: ${error.message}`)
        failed++
      } else {
        success++
      }
    }

    console.log(`\n  Success: ${success}`)
    console.log(`  Failed:  ${failed}`)

    // Show new distribution
    await showStats()
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
if (mode === 'stats') {
  await showStats()
} else {
  await recategorize()
}
