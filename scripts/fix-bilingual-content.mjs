/**
 * Fix bilingual content quality issues.
 *
 * Problem: 57 published articles have English text in content_zh (should be Chinese).
 * These are English-origin articles where the import script placed the original English
 * into content_zh and a GPT-rewritten English into content_en.
 *
 * Fix: Use the longer/original English as content_en, set content_zh to null.
 * Also fix excerpt_zh if it contains English.
 *
 * Usage:
 *   node scripts/fix-bilingual-content.mjs --dry-run   # preview changes
 *   node scripts/fix-bilingual-content.mjs              # apply fixes
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = resolve(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim()
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const dryRun = process.argv.includes('--dry-run')

function isEnglishText(text) {
  if (!text || text.length < 50) return false
  const zhChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  return zhChars < 5
}

function isChineseText(text) {
  if (!text || text.length < 10) return false
  const zhChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  return zhChars > 10
}

async function main() {
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`)

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id,slug,title_zh,title_en,content_zh,content_en,excerpt_zh,excerpt_en,status')
    .eq('status', 'published')

  if (error) {
    console.error('Failed to fetch articles:', error)
    process.exit(1)
  }

  let fixed = 0
  let skipped = 0

  for (const a of articles) {
    const zh = a.content_zh || ''
    const en = a.content_en || ''

    // Detect: content_zh is English text
    if (!isEnglishText(zh)) {
      continue
    }

    // Determine which content to keep as content_en
    // Use the longer version (the original), fall back to whichever exists
    let bestEn = zh.length >= en.length ? zh : en

    // If both are identical, just use one
    if (zh === en) bestEn = zh

    const updates = {
      content_en: bestEn,
      content_zh: null,
      updated_at: new Date().toISOString(),
    }

    // Fix excerpt_zh if it's English too
    if (a.excerpt_zh && isEnglishText(a.excerpt_zh)) {
      // Move English excerpt to excerpt_en if excerpt_en is empty or shorter
      if (!a.excerpt_en || a.excerpt_en.length < a.excerpt_zh.length) {
        updates.excerpt_en = a.excerpt_zh
      }
      updates.excerpt_zh = null
    }

    // Fix title_zh if it's English (and same as title_en or title_en is missing)
    const titleZhIsEn = a.title_zh && !isChineseText(a.title_zh) && /^[a-zA-Z]/.test(a.title_zh)
    if (titleZhIsEn) {
      if (!a.title_en || a.title_en.length < a.title_zh.length) {
        updates.title_en = a.title_zh
      }
      updates.title_zh = null
    }

    const label = (a.title_zh || a.title_en || a.slug).substring(0, 50)

    if (dryRun) {
      const changes = []
      if (updates.content_zh === null) changes.push(`content_zh(${zh.length})→null`)
      if (updates.content_en) changes.push(`content_en→${updates.content_en.length}c`)
      if (updates.excerpt_zh === null) changes.push('excerpt_zh→null')
      if (updates.title_zh === null) changes.push('title_zh→null')
      console.log(`  FIX: ${label}`)
      console.log(`        ${changes.join(', ')}`)
      fixed++
    } else {
      const { error: updateError } = await supabase
        .from('articles')
        .update(updates)
        .eq('id', a.id)

      if (updateError) {
        console.log(`  FAIL: ${label} — ${updateError.message}`)
      } else {
        console.log(`  FIXED: ${label}`)
        fixed++
      }
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`${dryRun ? 'DRY RUN ' : ''}Done: ${fixed} fixed, ${articles.length - fixed} OK`)
}

main().catch(console.error)
