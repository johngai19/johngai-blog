/**
 * Import parsed articles from JSON into Supabase.
 * Reads content/weizhiyong-articles.json and inserts as drafts.
 *
 * Usage:
 *   node scripts/import-to-supabase.mjs                    # import all
 *   node scripts/import-to-supabase.mjs --skip-existing    # skip articles whose slug already exists
 *
 * Requires .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
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
const skipExisting = process.argv.includes('--skip-existing')

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-\u4e00-\u9fff]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

function calcReadingTime(zh) {
  const chars = (zh || '').replace(/\s/g, '').length
  return Math.max(1, Math.round(chars / 500))
}

async function main() {
  const jsonPath = resolve(__dirname, '..', 'content', 'weizhiyong-articles.json')
  if (!existsSync(jsonPath)) {
    console.error('No articles file found. Run parse-wordpress-xml.mjs first.')
    process.exit(1)
  }

  const articles = JSON.parse(readFileSync(jsonPath, 'utf-8'))
  console.log(`Found ${articles.length} articles to import.\n`)

  let inserted = 0, updated = 0, skipped = 0, failed = 0

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i]
    const slug = a.slug || slugify(a.title || `article-${i}`)
    const title = a.title || 'Untitled'

    process.stdout.write(`[${i + 1}/${articles.length}] ${title.slice(0, 45).padEnd(45)} `)

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
      title_zh: title,
      title_en: null, // will be filled by batch-translate
      content_zh: a.content || null,
      content_en: null,
      excerpt_zh: null,
      excerpt_en: null,
      cover_image: null,
      category: a.category || null,
      tags: a.tags || [],
      status: 'draft',
      source: 'weizhiyong',
      source_url: a.url || null,
      published_at: a.date ? new Date(a.date).toISOString() : null,
      reading_time_min: calcReadingTime(a.content),
      updated_at: now,
    }

    try {
      if (existing) {
        // Update
        const { error } = await supabase
          .from('articles')
          .update(record)
          .eq('id', existing.id)
        if (error) throw error
        console.log('↻')
        updated++
      } else {
        // Insert
        record.created_at = now
        record.view_count = 0
        const { error } = await supabase.from('articles').insert(record)
        if (error) throw error
        console.log('✓')
        inserted++
      }
    } catch (e) {
      console.log(`✗ ${e.message}`)
      failed++
    }
  }

  console.log(`\n✅ Done: ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${failed} failed`)
}

main().catch(console.error)
