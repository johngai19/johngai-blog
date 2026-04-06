#!/usr/bin/env node
/**
 * Backup WordPress images from weizhiyong.com to Supabase Storage.
 *
 * 1. Fetches all published articles from Supabase
 * 2. Extracts weizhiyong.com image URLs from content_zh and content_en
 * 3. Downloads each image to /tmp
 * 4. Uploads to Supabase Storage bucket `media` under wp-backup/YYYY/MM/filename
 * 5. Updates article content to replace old URLs with Supabase Storage URLs
 * 6. Rate limited, idempotent, logs progress
 *
 * Usage:
 *   node scripts/backup-wordpress-images.mjs                # process up to 100 images
 *   node scripts/backup-wordpress-images.mjs --dry-run      # preview without changes
 *   node scripts/backup-wordpress-images.mjs --limit 50     # process up to 50 images
 *   node scripts/backup-wordpress-images.mjs --skip-update  # download+upload only, don't update articles
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname, basename, extname } from 'path'
import { fileURLToPath } from 'url'
import https from 'https'
import http from 'http'
import crypto from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repo = resolve(__dirname, '..')

// ─── Load .env.local ────────────────────────────────────────────────────────
const envText = readFileSync(resolve(repo, '.env.local'), 'utf-8')
const env = {}
for (const line of envText.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim()
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const SKIP_UPDATE = args.includes('--skip-update')
const limitIdx = args.indexOf('--limit')
const MAX_IMAGES = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 100

// ─── Mapping file ────────────────────────────────────────────────────────────
const MAPPING_FILE = resolve(repo, 'scripts', 'wp-image-url-mapping.json')
let urlMapping = {}
if (existsSync(MAPPING_FILE)) {
  urlMapping = JSON.parse(readFileSync(MAPPING_FILE, 'utf-8'))
  console.log(`Loaded ${Object.keys(urlMapping).length} existing mappings from wp-image-url-mapping.json`)
}

function saveMapping() {
  writeFileSync(MAPPING_FILE, JSON.stringify(urlMapping, null, 2))
}

// ─── Constants ───────────────────────────────────────────────────────────────
const BUCKET = 'media'
const WP_IMAGE_RE = /https?:\/\/(?:www\.)?weizhiyong\.com\/wp-content\/uploads\/(\d{4})\/(\d{2})\/([^\s"')>\]]+)/g
const RATE_LIMIT_MS = 300 // 300ms between downloads
const TMP_DIR = '/tmp/wp-image-backup'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

/** Download a URL to a local file path. Returns true on success. */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    const request = mod.get(url, { timeout: 30000 }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, destPath).then(resolve).catch(reject)
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`))
        return
      }
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        if (buffer.length < 100) {
          reject(new Error(`Suspiciously small file (${buffer.length} bytes) for ${url}`))
          return
        }
        const dir = dirname(destPath)
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
        writeFileSync(destPath, buffer)
        resolve(true)
      })
      res.on('error', reject)
    })
    request.on('timeout', () => { request.destroy(); reject(new Error(`Timeout for ${url}`)) })
    request.on('error', reject)
  })
}

/** Guess Content-Type from extension */
function guessContentType(filename) {
  const ext = extname(filename).toLowerCase()
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.gif': 'image/gif',
    '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp', '.ico': 'image/x-icon',
  }
  return map[ext] || 'application/octet-stream'
}

/** Sanitize filename for Supabase Storage (no Chinese chars allowed) */
function sanitizeFilename(filename) {
  // If filename is pure ASCII, keep it as-is
  if (/^[\x20-\x7E]+$/.test(filename)) return filename
  // Otherwise, hash the non-ASCII part and keep the extension
  const ext = extname(filename)
  const base = basename(filename, ext)
  const hash = crypto.createHash('md5').update(base).digest('hex').slice(0, 12)
  return `${hash}${ext}`
}

/** Extract all unique weizhiyong.com image URLs from text */
function extractWpImageUrls(text) {
  if (!text) return []
  const urls = new Set()
  let match
  const re = new RegExp(WP_IMAGE_RE.source, WP_IMAGE_RE.flags)
  while ((match = re.exec(text)) !== null) {
    urls.add(match[0])
  }
  return [...urls]
}

/** Parse a weizhiyong.com uploads URL into { year, month, filename } */
function parseWpUrl(url) {
  const re = new RegExp(WP_IMAGE_RE.source)
  const m = re.exec(url)
  if (!m) return null
  return { year: m[1], month: m[2], filename: m[3] }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET)
  if (exists) {
    console.log(`Bucket '${BUCKET}' already exists.`)
  } else {
    console.log(`Creating bucket '${BUCKET}'...`)
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) {
      console.error(`Failed to create bucket: ${error.message}`)
      process.exit(1)
    }
    console.log(`Bucket '${BUCKET}' created.`)
  }
}

async function fetchAllArticles() {
  // Fetch all published articles
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, content_zh, content_en')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    console.error(`Failed to fetch articles: ${error.message}`)
    process.exit(1)
  }
  console.log(`Fetched ${data.length} published articles.`)
  return data
}

async function processImage(url) {
  // Already migrated?
  if (urlMapping[url]) {
    return { status: 'skipped', newUrl: urlMapping[url] }
  }

  const parsed = parseWpUrl(url)
  if (!parsed) return { status: 'error', error: 'Could not parse URL' }

  const { year, month, filename } = parsed
  const safeFilename = sanitizeFilename(filename)
  const storagePath = `wp-backup/${year}/${month}/${safeFilename}`
  const localPath = resolve(TMP_DIR, year, month, safeFilename)

  // Download
  try {
    await downloadFile(url, localPath)
  } catch (err) {
    return { status: 'error', error: `Download failed: ${err.message}` }
  }

  if (DRY_RUN) {
    const newUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`
    return { status: 'dry-run', newUrl }
  }

  // Upload to Supabase Storage
  const fileBuffer = readFileSync(localPath)
  const contentType = guessContentType(filename)

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true, // overwrite if exists
    })

  if (error) {
    return { status: 'error', error: `Upload failed: ${error.message}` }
  }

  const newUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`
  urlMapping[url] = newUrl
  saveMapping()

  return { status: 'uploaded', newUrl }
}

async function updateArticleContent(article, replacements) {
  if (SKIP_UPDATE || DRY_RUN) return

  let { content_zh, content_en } = article
  let zhChanged = false
  let enChanged = false

  for (const [oldUrl, newUrl] of Object.entries(replacements)) {
    if (content_zh && content_zh.includes(oldUrl)) {
      content_zh = content_zh.split(oldUrl).join(newUrl)
      zhChanged = true
    }
    if (content_en && content_en.includes(oldUrl)) {
      content_en = content_en.split(oldUrl).join(newUrl)
      enChanged = true
    }
  }

  if (!zhChanged && !enChanged) return

  const update = {}
  if (zhChanged) update.content_zh = content_zh
  if (enChanged) update.content_en = content_en

  const { error } = await supabase
    .from('articles')
    .update(update)
    .eq('id', article.id)

  if (error) {
    console.error(`  Failed to update article ${article.slug}: ${error.message}`)
  } else {
    const fields = [zhChanged && 'content_zh', enChanged && 'content_en'].filter(Boolean).join(', ')
    console.log(`  Updated ${article.slug} (${fields})`)
  }
}

async function main() {
  console.log('=== WordPress Image Backup to Supabase Storage ===')
  if (DRY_RUN) console.log('[DRY RUN] No changes will be written.\n')
  console.log(`Max images per run: ${MAX_IMAGES}\n`)

  // Step 1: Ensure bucket exists
  await ensureBucket()

  // Step 2: Fetch all articles
  const articles = await fetchAllArticles()

  // Step 3: Collect all unique image URLs
  const allUrls = new Set()
  const articleUrlMap = new Map() // articleId -> Set<url>

  for (const article of articles) {
    const urls = [
      ...extractWpImageUrls(article.content_zh),
      ...extractWpImageUrls(article.content_en),
    ]
    if (urls.length > 0) {
      articleUrlMap.set(article.id, new Set(urls))
      for (const u of urls) allUrls.add(u)
    }
  }

  const totalUrls = allUrls.size
  const alreadyMapped = [...allUrls].filter(u => urlMapping[u]).length
  const toProcess = [...allUrls].filter(u => !urlMapping[u])
  const batch = toProcess.slice(0, MAX_IMAGES)

  console.log(`\nFound ${totalUrls} unique weizhiyong.com image URLs across ${articleUrlMap.size} articles.`)
  console.log(`Already migrated: ${alreadyMapped}`)
  console.log(`To process this run: ${batch.length}`)
  if (toProcess.length > MAX_IMAGES) {
    console.log(`Remaining after this run: ${toProcess.length - MAX_IMAGES}`)
  }
  console.log()

  // Step 4: Process images
  let uploaded = 0, skipped = 0, errors = 0

  for (let i = 0; i < batch.length; i++) {
    const url = batch[i]
    const progress = `[${i + 1}/${batch.length}]`

    const result = await processImage(url)

    switch (result.status) {
      case 'uploaded':
        uploaded++
        console.log(`${progress} OK    ${basename(parseWpUrl(url)?.filename || url)}`)
        break
      case 'dry-run':
        uploaded++
        console.log(`${progress} DRY   ${basename(parseWpUrl(url)?.filename || url)} → ${result.newUrl}`)
        break
      case 'skipped':
        skipped++
        console.log(`${progress} SKIP  ${basename(parseWpUrl(url)?.filename || url)}`)
        break
      case 'error':
        errors++
        console.error(`${progress} ERR   ${url} — ${result.error}`)
        break
    }

    // Rate limit downloads
    if (i < batch.length - 1) {
      await sleep(RATE_LIMIT_MS)
    }
  }

  console.log(`\n--- Image processing complete ---`)
  console.log(`Uploaded: ${uploaded}  Skipped: ${skipped}  Errors: ${errors}`)

  // Step 5: Update article content with new URLs
  if (!SKIP_UPDATE && !DRY_RUN && uploaded > 0) {
    console.log('\n--- Updating article content ---')
    for (const article of articles) {
      const articleUrls = articleUrlMap.get(article.id)
      if (!articleUrls) continue

      // Build replacements for this article (only URLs we have mappings for)
      const replacements = {}
      for (const url of articleUrls) {
        if (urlMapping[url]) {
          replacements[url] = urlMapping[url]
        }
      }
      if (Object.keys(replacements).length > 0) {
        await updateArticleContent(article, replacements)
      }
    }
  }

  // Step 6: Summary
  console.log('\n=== Summary ===')
  console.log(`Total unique WP image URLs: ${totalUrls}`)
  console.log(`Migrated (all time):        ${Object.keys(urlMapping).length}`)
  console.log(`Remaining:                  ${totalUrls - Object.keys(urlMapping).length}`)

  if (Object.keys(urlMapping).length > 0) {
    console.log(`\nMapping file: ${MAPPING_FILE}`)
  }

  // Step 7: Verify a sample of uploaded URLs
  if (!DRY_RUN && uploaded > 0) {
    console.log('\n--- Verification (sampling 3 URLs) ---')
    const mappedUrls = Object.values(urlMapping)
    const sample = mappedUrls.slice(-Math.min(3, mappedUrls.length))
    for (const url of sample) {
      try {
        const res = await fetch(url, { method: 'HEAD' })
        console.log(`  ${res.status === 200 ? 'OK' : 'FAIL'} ${url}`)
      } catch (err) {
        console.log(`  ERR  ${url} — ${err.message}`)
      }
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
