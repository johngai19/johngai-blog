#!/usr/bin/env node
/**
 * Generate real cover images using DALL-E 3, upload to Supabase Storage,
 * and update the articles table.
 *
 * Pipeline:
 *   1. Select articles with OG-only covers (no real images)
 *   2. Generate DALL-E 3 image for each article
 *   3. Upload to Supabase Storage media/covers/<slug>.png
 *   4. Update article.cover_image with the public URL
 *
 * Usage:
 *   node scripts/generate-and-upload-covers.mjs [--limit N] [--dry-run]
 *   node scripts/generate-and-upload-covers.mjs --ids id1,id2,id3
 *   node scripts/generate-and-upload-covers.mjs --latest 2        # regenerate N most recent articles
 *   node scripts/generate-and-upload-covers.mjs --force --limit 20 # regenerate even if cover exists
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repo = resolve(__dirname, '..')

// ─── Load .env.local ─────────────────────────────────────────────────────
const envText = readFileSync(resolve(repo, '.env.local'), 'utf-8')
const env = {}
for (const line of envText.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim()
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_API_KEY = env.OPENAI_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}
if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── CLI args ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 10
const idsIdx = args.indexOf('--ids')
const SPECIFIC_IDS = idsIdx >= 0 ? args[idsIdx + 1].split(',') : null
const FORCE = args.includes('--force')
const latestIdx = args.indexOf('--latest')
const LATEST_N = latestIdx >= 0 ? parseInt(args[latestIdx + 1]) : 0

// ─── Category styles for DALL-E prompts ──────────────────────────────────
// Each category has an array of sub-styles for visual diversity.
// Articles rotate through sub-styles based on their index in the batch.
const CATEGORY_STYLES = {
  engineering: [
    'minimalist tech illustration with clean geometric lines, circuit patterns, code elements. Dark blue and cyan color palette. Modern and professional.',
    'isometric 3D illustration of technology components, soft shadows, pastel tech colors, clean white background.',
    'dark mode UI-inspired abstract art, glowing neon lines on dark background, futuristic data visualization aesthetic.',
  ],
  industry: [
    'abstract business visualization with flowing data streams, geometric shapes, professional atmosphere. Blue and grey color palette.',
    'aerial photography style of urban landscapes, tilt-shift miniature effect, warm golden hour lighting.',
    'modern infographic illustration style, clean flat shapes, muted corporate color palette with one accent color.',
  ],
  books: [
    'warm literary illustration with soft ambient lighting, books, reading atmosphere. Amber and cream color palette with subtle textures.',
    'vintage bookshop photography, shallow depth of field, warm tungsten lighting, rich wood tones.',
    'whimsical storybook illustration, hand-drawn feel, soft watercolor washes, fantasy atmosphere.',
  ],
  life: [
    'warm personal photography style, natural light, everyday beauty, nostalgic atmosphere. Earth tones with soft grain.',
    'Japanese aesthetic wabi-sabi photography, minimalist composition, muted natural tones, serene atmosphere.',
    'golden hour landscape photography, lens flare, warm saturated colors, cinematic wide angle.',
  ],
  startup: [
    'dynamic energetic illustration with growth metaphors, bold geometric shapes. Orange and white color palette.',
    'modern gradient mesh art, vibrant purple and orange, abstract flowing shapes, startup energy.',
    'pop art inspired bold illustration, bright contrasting colors, comic-style halftone dots, energetic composition.',
  ],
  writing: [
    'modern digital illustration, vibrant colors, clean composition, contemporary art style.',
    'cinematic photography style, dramatic lighting, rich colors, film grain.',
    'abstract geometric art, bold colors, modern minimalist design.',
    'watercolor illustration, soft gradients, artistic brushwork, dreamy atmosphere.',
    'vintage poster design, retro typography feel, warm color palette.',
    'surreal digital art, imaginative composition, vivid colors.',
    'flat design illustration, clean vectors, bright cheerful palette.',
    'oil painting style, rich textures, classical composition with modern subject.',
  ],
  'zhihu-qa': [
    'clean knowledge-sharing illustration, Q&A conversation bubbles, blue gradient background, modern flat design with subtle depth.',
    'minimalist question-answer visual, speech bubble icons, sky blue and white palette, professional knowledge exchange.',
    'modern social media Q&A aesthetic, thought bubbles, clean lines, blue tones with warm accents.',
  ],
}

function buildImagePrompt(article, index = 0) {
  const category = article.category || 'writing'
  const styles = CATEGORY_STYLES[category] || CATEGORY_STYLES.writing
  const style = styles[index % styles.length]
  const title = article.title_en || article.title_zh || article.slug

  return `Create a beautiful blog cover image (landscape 1792x1024).
Style: ${style}
Theme: Inspired by "${title}".
STRICT RULES: Absolutely NO text, NO words, NO letters, NO numbers, NO characters of any language in the image.
Only abstract, symbolic, or illustrative visual representation.
Clean, modern composition suitable as a blog header image.`
}

// ─── DALL-E 3 generation ──────────────────────────────────────────────────
async function generateImage(article, index = 0) {
  const prompt = buildImagePrompt(article, index)
  console.log(`  Prompt: ${prompt.slice(0, 120)}...`)

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
      response_format: 'url',
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`DALL-E API ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const imageUrl = data.data[0].url

  // Download the image
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error(`Image download failed: ${imgRes.status}`)

  return Buffer.from(await imgRes.arrayBuffer())
}

// ─── Supabase Storage upload ──────────────────────────────────────────────
async function uploadToSupabase(slug, imageBuffer) {
  // Use a clean filename derived from slug (truncate if too long)
  const cleanSlug = slug.replace(/[^a-z0-9-]/g, '').slice(0, 80)
  const storagePath = `covers/${cleanSlug}.png`

  const { data, error } = await supabase.storage
    .from('media')
    .upload(storagePath, imageBuffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('media')
    .getPublicUrl(storagePath)

  return urlData.publicUrl
}

// ─── Update DB ────────────────────────────────────────────────────────────
async function updateArticleCover(articleId, coverUrl) {
  const { error } = await supabase
    .from('articles')
    .update({ cover_image: coverUrl })
    .eq('id', articleId)

  if (error) throw new Error(`DB update failed: ${error.message}`)
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('='.repeat(60))
  console.log('Cover Image Generation Pipeline')
  console.log(`  DALL-E 3 → Supabase Storage → DB Update`)
  console.log(`  Limit: ${LIMIT} | Dry run: ${DRY_RUN} | Force: ${FORCE} | Latest: ${LATEST_N || 'off'}`)
  console.log('='.repeat(60) + '\n')

  // Fetch target articles
  let articles
  if (SPECIFIC_IDS) {
    const { data, error } = await supabase
      .from('articles')
      .select('id, slug, title_zh, title_en, category, cover_image')
      .in('id', SPECIFIC_IDS)
    if (error) throw error
    articles = data
  } else if (LATEST_N > 0) {
    // Get the N most recent published articles regardless of cover status
    const { data, error } = await supabase
      .from('articles')
      .select('id, slug, title_zh, title_en, category, cover_image, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(LATEST_N)
    if (error) throw error
    articles = data
  } else {
    // Build query: articles needing covers (OG-only), or all published if --force
    let query = supabase
      .from('articles')
      .select('id, slug, title_zh, title_en, category, cover_image, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (!FORCE) {
      query = query.like('cover_image', '/api/og%')
    }

    const { data, error } = await query.limit(1000)
    if (error) throw error

    // Pick diverse articles across categories
    const picked = []
    const cats = ['engineering', 'industry', 'books', 'startup', 'life', 'writing']
    for (const cat of cats) {
      const catArticles = data.filter(a => a.category === cat)
      for (const a of catArticles.slice(0, 3)) {
        picked.push(a)
        if (picked.length >= LIMIT) break
      }
      if (picked.length >= LIMIT) break
    }
    // Fill remaining with most recent
    if (picked.length < LIMIT) {
      const remaining = data.filter(a => !picked.find(p => p.id === a.id))
      for (const a of remaining.slice(0, LIMIT - picked.length)) {
        picked.push(a)
      }
    }
    articles = picked.slice(0, LIMIT)
  }

  console.log(`Selected ${articles.length} articles for cover generation:\n`)

  const results = { success: 0, failed: 0, skipped: 0, totalBytes: 0 }
  const generated = []

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i]
    const title = (article.title_en || article.title_zh || article.slug).slice(0, 60)
    console.log(`[${i + 1}/${articles.length}] ${title}`)
    const cat = article.category || 'writing'
    const styles = CATEGORY_STYLES[cat] || CATEGORY_STYLES.writing
    const styleIdx = i % styles.length
    console.log(`  Category: ${cat} | Style: ${styleIdx + 1}/${styles.length} | Slug: ${article.slug.slice(0, 50)}`)

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would generate + upload\n`)
      results.skipped++
      continue
    }

    try {
      // Step 1: Generate image
      console.log('  Generating with DALL-E 3...')
      const imageBuffer = await generateImage(article, i)
      const sizeKB = Math.round(imageBuffer.length / 1024)
      console.log(`  Generated: ${sizeKB} KB`)

      // Step 2: Upload to Supabase Storage
      console.log('  Uploading to Supabase Storage...')
      const publicUrl = await uploadToSupabase(article.slug, imageBuffer)
      console.log(`  Uploaded: ${publicUrl.slice(0, 80)}...`)

      // Step 3: Update DB
      console.log('  Updating database...')
      await updateArticleCover(article.id, publicUrl)
      console.log(`  DB updated successfully`)

      results.success++
      results.totalBytes += imageBuffer.length
      generated.push({
        slug: article.slug,
        title: title,
        url: publicUrl,
        size: sizeKB,
      })

      console.log(`  DONE\n`)

      // Rate limit: DALL-E 3 has ~5 images/min limit
      if (i < articles.length - 1) {
        console.log('  Waiting 15s for rate limit...')
        await new Promise(r => setTimeout(r, 15000))
      }
    } catch (err) {
      console.error(`  FAILED: ${err.message}\n`)
      results.failed++

      // On rate limit, wait longer and retry once
      if (err.message.includes('429') || err.message.includes('rate')) {
        console.log('  Rate limited. Waiting 60s...')
        await new Promise(r => setTimeout(r, 60000))
      }
    }
  }

  // ─── Summary ──────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60))
  console.log('GENERATION COMPLETE')
  console.log('='.repeat(60))
  console.log(`Success: ${results.success}`)
  console.log(`Failed:  ${results.failed}`)
  console.log(`Skipped: ${results.skipped}`)
  console.log(`Total size: ${(results.totalBytes / 1024 / 1024).toFixed(1)} MB`)
  console.log(`Est. cost: $${(results.success * 0.08).toFixed(2)} (${results.success} x $0.08)`)

  if (generated.length > 0) {
    console.log('\nGenerated covers:')
    generated.forEach((g, i) => {
      console.log(`  ${i + 1}. ${g.title} (${g.size}KB)`)
      console.log(`     ${g.url}`)
    })
  }

  // Save results log
  const logPath = resolve(repo, 'scripts', 'cover-generation-log.json')
  const log = {
    timestamp: new Date().toISOString(),
    results,
    generated,
  }
  writeFileSync(logPath, JSON.stringify(log, null, 2))
  console.log(`\nLog saved to: ${logPath}`)
}

main().catch(e => { console.error(e); process.exit(1) })
