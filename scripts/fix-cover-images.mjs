#!/usr/bin/env node
/**
 * Fix cover images for all published articles.
 *
 * P1: Set cover_image for 2 latest articles with existing SVG files
 * P2: Set cover_image = /api/og?title=...&category=... for all articles without covers
 *
 * Idempotent: only updates rows where cover_image IS NULL.
 *
 * Usage: node scripts/fix-cover-images.mjs [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repo = resolve(__dirname, '..')

// Load env
const envText = readFileSync(resolve(repo, '.env.local'), 'utf-8')
const env = {}
for (const line of envText.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim()
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const DRY_RUN = process.argv.includes('--dry-run')

if (DRY_RUN) console.log('[DRY RUN] No changes will be written.\n')

// ─── P1: Known SVG covers ───────────────────────────────────────────────
const MANUAL_COVERS = [
  { slug: 'the-model-wars-have-entered-phase-two', cover_image: '/covers/model-wars-phase-two.svg' },
  { slug: 'agent-harness-and-meditation', cover_image: '/covers/agent-harness-meditation.svg' },
]

async function fixManualCovers() {
  console.log('=== P1: Fix manual SVG covers ===')
  for (const { slug, cover_image } of MANUAL_COVERS) {
    // Check current state
    const { data: row } = await supabase
      .from('articles')
      .select('id, slug, cover_image')
      .eq('slug', slug)
      .single()

    if (!row) {
      console.log(`  SKIP  ${slug} — not found in DB`)
      continue
    }
    if (row.cover_image) {
      console.log(`  SKIP  ${slug} — already has cover: ${row.cover_image}`)
      continue
    }

    if (DRY_RUN) {
      console.log(`  WOULD SET  ${slug} → ${cover_image}`)
      continue
    }

    const { error } = await supabase
      .from('articles')
      .update({ cover_image })
      .eq('id', row.id)

    if (error) {
      console.error(`  ERROR  ${slug}: ${error.message}`)
    } else {
      console.log(`  SET  ${slug} → ${cover_image}`)
    }
  }
  console.log()
}

// ─── P2: OG-based covers for the rest ───────────────────────────────────
async function fixOgCovers() {
  console.log('=== P2: Set OG covers for articles without cover_image ===')

  // Fetch all articles without cover_image
  // Supabase returns max 1000 rows per request, paginate if needed
  let allArticles = []
  let from = 0
  const PAGE = 1000

  while (true) {
    const { data, error } = await supabase
      .from('articles')
      .select('id, slug, title_en, title_zh, category, cover_image')
      .is('cover_image', null)
      .eq('status', 'published')
      .range(from, from + PAGE - 1)

    if (error) {
      console.error(`  Fetch error: ${error.message}`)
      break
    }
    allArticles = allArticles.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }

  console.log(`  Found ${allArticles.length} articles without cover_image\n`)

  if (allArticles.length === 0) return

  // Build updates
  const updates = allArticles.map(a => {
    // Prefer English title for OG (cleaner URL encoding), fallback to Chinese
    const displayTitle = a.title_en || a.title_zh || a.slug
    const category = a.category || 'writing'
    const ogUrl = `/api/og?title=${encodeURIComponent(displayTitle)}&category=${category}`
    return { id: a.id, slug: a.slug, cover_image: ogUrl }
  })

  if (DRY_RUN) {
    for (const u of updates.slice(0, 5)) {
      console.log(`  WOULD SET  ${u.slug} → ${u.cover_image.slice(0, 80)}...`)
    }
    if (updates.length > 5) console.log(`  ... and ${updates.length - 5} more`)
    console.log()
    return
  }

  // Batch update: Supabase doesn't support bulk update by different values easily,
  // so we do individual updates but in parallel batches of 20
  const BATCH = 20
  let updated = 0
  let errors = 0

  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH)
    const results = await Promise.all(
      batch.map(u =>
        supabase
          .from('articles')
          .update({ cover_image: u.cover_image })
          .eq('id', u.id)
          .then(({ error }) => {
            if (error) {
              console.error(`  ERROR  ${u.slug}: ${error.message}`)
              errors++
            } else {
              updated++
            }
          })
      )
    )
    process.stdout.write(`  Progress: ${updated + errors}/${updates.length}\r`)
  }

  console.log(`\n  Updated: ${updated}`)
  if (errors) console.log(`  Errors: ${errors}`)
  console.log()
}

// ─── Main ───────────────────────────────────────────────────────────────
async function main() {
  console.log('Fix Cover Images for Published Articles')
  console.log('='.repeat(50) + '\n')

  await fixManualCovers()
  await fixOgCovers()

  console.log('Done.')
}

main().catch(e => { console.error(e); process.exit(1) })
