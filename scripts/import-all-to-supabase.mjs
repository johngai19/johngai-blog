/**
 * Import ALL cleaned+translated articles into Supabase.
 * Reads content/index.json, cleaned/*.md, translated/*-en.md
 *
 * Usage:
 *   node scripts/import-all-to-supabase.mjs                 # import all translated articles
 *   node scripts/import-all-to-supabase.mjs --skip-existing # skip existing slugs
 *   node scripts/import-all-to-supabase.mjs --dry-run       # preview without inserting
 *   node scripts/import-all-to-supabase.mjs --limit 50      # import first 50 only
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = resolve(__dirname, '..', 'content')

// Load .env.local
const envPath = resolve(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim()
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// Parse args
const args = process.argv.slice(2)
const skipExisting = args.includes('--skip-existing')
const dryRun = args.includes('--dry-run')
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : Infinity

function parseFrontmatter(content) {
  if (!content.startsWith('---')) return [{}, content]
  const parts = content.split('---')
  if (parts.length < 3) return [{}, content]
  const meta = {}
  for (const line of parts[1].trim().split('\n')) {
    const m = line.match(/^([^:]+):\s*"?([^"]*)"?$/)
    if (m) meta[m[1].trim()] = m[2].trim()
  }
  return [meta, parts.slice(2).join('---').trim()]
}

function calcReadingTime(text) {
  const chars = (text || '').replace(/\s/g, '').length
  return Math.max(1, Math.round(chars / 500))
}

async function main() {
  // Load index
  const index = JSON.parse(readFileSync(resolve(BASE, 'index.json'), 'utf-8'))

  // Filter to articles that have both cleaned and translated content
  const candidates = index.articles.filter(a => {
    if (a.priority === 'skip') return false
    const cleanedPath = resolve(BASE, a.files?.cleaned || `cleaned/${a.slug}.md`)
    const translatedPath = resolve(BASE, `translated/${a.slug}-en.md`)
    return existsSync(cleanedPath) || existsSync(translatedPath)
  })

  const toImport = candidates.slice(0, LIMIT)
  console.log(`Total in index: ${index.articles.length}`)
  console.log(`Candidates (cleaned or translated): ${candidates.length}`)
  console.log(`To import: ${toImport.length}`)
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}, Skip existing: ${skipExisting}\n`)

  let inserted = 0, updated = 0, skipped = 0, failed = 0

  for (let i = 0; i < toImport.length; i++) {
    const a = toImport[i]
    const slug = a.slug

    // Read cleaned content (Chinese)
    let contentZh = ''
    let excerptZh = ''
    const cleanedPath = resolve(BASE, a.files?.cleaned || `cleaned/${slug}.md`)
    if (existsSync(cleanedPath)) {
      const raw = readFileSync(cleanedPath, 'utf-8')
      const [meta, body] = parseFrontmatter(raw)
      contentZh = body
      excerptZh = meta.excerpt || contentZh.slice(0, 300).replace(/\n/g, ' ').trim()
    }

    // Read translated content (English)
    let contentEn = ''
    let titleEn = ''
    let excerptEn = ''
    const translatedPath = resolve(BASE, `translated/${slug}-en.md`)
    if (existsSync(translatedPath)) {
      const raw = readFileSync(translatedPath, 'utf-8')
      const [meta, body] = parseFrontmatter(raw)
      contentEn = body
      titleEn = meta.title_en || meta.title || ''
      excerptEn = meta.excerpt_en || meta.excerpt || contentEn.slice(0, 300).replace(/\n/g, ' ').trim()
    }

    // Skip if no content at all
    if (!contentZh && !contentEn) {
      skipped++
      continue
    }

    process.stdout.write(`[${i + 1}/${toImport.length}] ${(a.title_zh || slug).slice(0, 42).padEnd(42)} `)

    // Check if exists
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing && skipExisting) {
      console.log('(skip)')
      skipped++
      continue
    }

    const now = new Date().toISOString()
    const record = {
      slug,
      title_zh: a.title_zh || slug,
      title_en: titleEn || null,
      content_zh: contentZh || null,
      content_en: contentEn || null,
      excerpt_zh: excerptZh || null,
      excerpt_en: excerptEn || null,
      cover_image: null,
      category: a.category || 'writing',
      tags: a.tags || [],
      status: 'draft',
      source: a.source || null,
      source_url: a.source_url || null,
      published_at: a.original_date ? new Date(a.original_date).toISOString() : null,
      reading_time_min: calcReadingTime(contentZh),
      updated_at: now,
    }

    if (dryRun) {
      console.log(`→ ${record.status} (${record.category}, ${record.reading_time_min}min)`)
      inserted++
      continue
    }

    try {
      if (existing) {
        const { error } = await supabase
          .from('articles')
          .update(record)
          .eq('id', existing.id)
        if (error) throw error
        console.log('↻')
        updated++
      } else {
        record.created_at = now
        record.view_count = 0
        const { error } = await supabase.from('articles').insert(record)
        if (error) throw error
        console.log('✓')
        inserted++
      }
    } catch (e) {
      console.log(`✗ ${e.message?.slice(0, 80) || e}`)
      failed++
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`${dryRun ? 'DRY RUN ' : ''}DONE: ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${failed} failed`)
}

main().catch(console.error)
