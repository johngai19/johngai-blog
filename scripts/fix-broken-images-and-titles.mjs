#!/usr/bin/env node
/**
 * Round 4 cleanup:
 * 1. Remove broken image references (wesinx.com + Qiniu CDN) from article content
 * 2. Fix broken wesinx links (markdown links to offline site)
 * 3. Generate title_en for articles missing English titles
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
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

// Broken image domains
const BROKEN_DOMAINS = ['www.wesinx.com', 'wesinx.com', 'omdmz8z30.bkt.clouddn.com']

function isBrokenUrl(url) {
  try {
    const hostname = new URL(url).hostname
    return BROKEN_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))
  } catch {
    return false
  }
}

/**
 * Remove broken <img> tags from HTML content
 */
function removeHtmlImgTags(content) {
  if (!content) return content
  // Match <img ...src="broken_url"...> or <img ...src='broken_url'...>
  return content.replace(/<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*\/?>/gi, (match, url) => {
    if (isBrokenUrl(url)) {
      return '<!-- image removed: source offline -->'
    }
    return match
  })
}

/**
 * Remove broken markdown images ![alt](url)
 */
function removeMdImages(content) {
  if (!content) return content
  return content.replace(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g, (match, url) => {
    if (isBrokenUrl(url)) {
      return '<!-- image removed: source offline -->'
    }
    return match
  })
}

/**
 * Fix broken markdown links [text](url) pointing to wesinx
 * Replace with dead link notice
 */
function fixBrokenLinks(content) {
  if (!content) return content
  return content.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (match, text, url) => {
    if (isBrokenUrl(url)) {
      // Keep the text but remove the link
      return text
    }
    return match
  })
}

/**
 * Clean all broken references from content
 */
function cleanContent(content) {
  if (!content) return { content, changed: false }
  let result = content
  result = removeHtmlImgTags(result)
  result = removeMdImages(result)
  result = fixBrokenLinks(result)
  return { content: result, changed: result !== content }
}

/**
 * Simple Chinese-to-English title translations for known articles.
 * Deterministic mapping - no API calls needed.
 */
const TITLE_TRANSLATIONS = {
  '对决未来：马尔科夫与中本聪——《后谷歌时代：大数据的衰落及区块链经济的崛起》':
    'Confronting the Future: Markov vs. Satoshi — Life After Google',
  '[回答] 编程自动化似乎已经是大势所趋什么时候能够真正实现？':
    'When Will Programming Automation Truly Arrive?',
  '[回答] 非标自动化设备维修员职业发展方向有哪些？':
    'Career Paths for Non-Standard Automation Equipment Technicians',
  '[回答] 神舟笔记本为什么那么廉价？靠谱吗？':
    'Why Are Hasee Laptops So Cheap — Are They Reliable?',
  '长风破浪会有时，直挂云帆济沧海':
    'Setting Sail Through Winds and Waves — A Journey of Ambition',
  '[回答] 妈妈是一个扶弟魔怎么办？':
    'How to Deal with a Mother Who Over-Supports Her Siblings',
  '[回答] 女生说「奶茶冰得手凉」时男生应怎么做？':
    'What Should a Guy Do When a Girl Says Her Hands Are Cold from Iced Tea?',
  '[回答] 如何评价《权力的游戏》第八季第四集 S08E04「The Last Of The Starks」 ?':
    'Reviewing Game of Thrones S08E04 — The Last of the Starks',
  '[回答] 我想问下为什么海尔品牌这么不受知乎大神的待见？':
    'Why Does the Haier Brand Get So Little Love on Zhihu?',
  '[回答] 智慧能源未来前景如何？':
    'What Is the Future of Smart Energy?',
  '异曲同工——Windows，Linux和Mac OS系统下命令行格式化移动硬盘的方法':
    'Same Goal, Different Paths — Formatting External Drives via CLI on Windows, Linux, and macOS',
  '我们该如何面对现代生活中无处不在的焦虑？——阿兰德波顿《身份的焦虑》如是说':
    'How Should We Face Ubiquitous Modern Anxiety? — Lessons from Alain de Botton\'s Status Anxiety',
}

async function main() {
  console.log('=== Round 4: Fix Broken Images + Missing Titles ===\n')

  // Fetch all published articles
  let allArticles = []
  let from = 0
  const PAGE = 1000
  while (true) {
    const { data, error } = await supabase
      .from('articles')
      .select('id, slug, title_zh, title_en, content_zh, content_en, cover_image')
      .eq('status', 'published')
      .range(from, from + PAGE - 1)
    if (error) { console.error('Fetch error:', error.message); return }
    allArticles = allArticles.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }
  console.log(`Fetched ${allArticles.length} published articles\n`)

  // --- Task 1: Fix broken images ---
  console.log('--- Task 1: Fix broken image references ---\n')
  let imageFixCount = 0
  let totalBrokenRemoved = 0

  for (const article of allArticles) {
    const zhResult = cleanContent(article.content_zh)
    const enResult = cleanContent(article.content_en)

    if (!zhResult.changed && !enResult.changed) continue

    const update = {}
    if (zhResult.changed) update.content_zh = zhResult.content
    if (enResult.changed) update.content_en = enResult.content

    // Count removals
    const zhRemovals = (update.content_zh || '').split('<!-- image removed: source offline -->').length - 1
    const enRemovals = (update.content_en || '').split('<!-- image removed: source offline -->').length - 1
    totalBrokenRemoved += zhRemovals + enRemovals

    const { error } = await supabase
      .from('articles')
      .update(update)
      .eq('id', article.id)

    if (error) {
      console.error(`  ERROR updating ${article.slug}:`, error.message)
    } else {
      imageFixCount++
      const title = (article.title_en || article.title_zh || article.slug).slice(0, 50)
      console.log(`  Fixed: ${title} (${zhRemovals} zh + ${enRemovals} en removals)`)
    }
  }
  console.log(`\nImage fix summary: ${imageFixCount} articles updated, ${totalBrokenRemoved} broken refs removed\n`)

  // --- Task 2: Fix missing title_en ---
  console.log('--- Task 2: Fix missing title_en ---\n')
  let titleFixCount = 0

  for (const article of allArticles) {
    if (article.title_en && article.title_en.trim() !== '') continue

    const zhTitle = (article.title_zh || '').trim()
    if (!zhTitle) continue

    const enTitle = TITLE_TRANSLATIONS[zhTitle]
    if (!enTitle) {
      console.log(`  SKIP (no translation): ${zhTitle}`)
      continue
    }

    const { error } = await supabase
      .from('articles')
      .update({ title_en: enTitle })
      .eq('id', article.id)

    if (error) {
      console.error(`  ERROR: ${article.slug}:`, error.message)
    } else {
      titleFixCount++
      console.log(`  Translated: "${zhTitle}" → "${enTitle}"`)
    }
  }
  console.log(`\nTitle fix summary: ${titleFixCount} articles updated\n`)

  console.log('=== Round 4 complete ===')
}

main().catch(e => { console.error(e); process.exit(1) })
