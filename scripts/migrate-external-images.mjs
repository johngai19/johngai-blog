#!/usr/bin/env node
/**
 * Migrate high-risk external images to Supabase Storage.
 *
 * Targets:
 *   - Zhihu CDN (pic1-4.zhimg.com)      — 26 URLs, hotlink-protected
 *   - Wesinx (www.wesinx.com)            — 7 URLs, company may go offline
 *   - Qiniu CDN (omdmz8z30.bkt.clouddn.com) — 5 URLs, likely already broken
 *
 * Flow:
 *   1. Fetch all published articles from Supabase
 *   2. Extract matching external image URLs from content_zh / content_en
 *   3. Download each image to /tmp
 *   4. Upload to Supabase Storage bucket `media` under ext-backup/<domain>/<hash>.<ext>
 *   5. Update article content to replace old URLs with Supabase Storage URLs
 *   6. Persist URL mapping to scripts/ext-image-url-mapping.json (idempotent)
 *
 * Usage:
 *   node scripts/migrate-external-images.mjs                # process all
 *   node scripts/migrate-external-images.mjs --dry-run      # preview without changes
 *   node scripts/migrate-external-images.mjs --skip-update  # download+upload only
 *   node scripts/migrate-external-images.mjs --limit 10     # process up to N images
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname, extname } from 'path'
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
const MAX_IMAGES = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 999

// ─── Mapping file ────────────────────────────────────────────────────────────
const MAPPING_FILE = resolve(repo, 'scripts', 'ext-image-url-mapping.json')
let urlMapping = {}
if (existsSync(MAPPING_FILE)) {
  urlMapping = JSON.parse(readFileSync(MAPPING_FILE, 'utf-8'))
  console.log(`Loaded ${Object.keys(urlMapping).length} existing mappings`)
}

function saveMapping() {
  writeFileSync(MAPPING_FILE, JSON.stringify(urlMapping, null, 2))
}

// ─── Target domains ─────────────────────────────────────────────────────────
const TARGET_DOMAINS = [
  'pic1.zhimg.com',
  'pic2.zhimg.com',
  'pic3.zhimg.com',
  'pic4.zhimg.com',
  'www.wesinx.com',
  'omdmz8z30.bkt.clouddn.com',
]

const DOMAIN_RE = new RegExp(
  `https?://(?:${TARGET_DOMAINS.map(d => d.replace(/\./g, '\\.')).join('|')})/[^\\s"')>\\]]+`,
  'g'
)

// ─── Constants ───────────────────────────────────────────────────────────────
const BUCKET = 'media'
const RATE_LIMIT_MS = 500
const TMP_DIR = '/tmp/ext-image-backup'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Referer': 'https://www.zhihu.com/',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
    }
    const request = mod.get(url, { timeout: 30000, headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, destPath).then(resolve).catch(reject)
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        if (buffer.length < 100) {
          reject(new Error(`Too small (${buffer.length} bytes)`))
          return
        }
        const dir = dirname(destPath)
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
        writeFileSync(destPath, buffer)
        resolve(true)
      })
      res.on('error', reject)
    })
    request.on('timeout', () => { request.destroy(); reject(new Error('Timeout')) })
    request.on('error', reject)
  })
}

function guessContentType(filename) {
  const ext = extname(filename).toLowerCase()
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.gif': 'image/gif',
    '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
  }
  return map[ext] || 'image/jpeg'
}

/** Extract domain category for storage path */
function domainCategory(url) {
  if (url.includes('zhimg.com')) return 'zhihu'
  if (url.includes('wesinx.com')) return 'wesinx'
  if (url.includes('clouddn.com')) return 'qiniu'
  return 'other'
}

/** Generate a safe storage path from a URL */
function storagePathFromUrl(url) {
  const category = domainCategory(url)
  const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 16)

  // Try to preserve original extension
  const urlPath = new URL(url).pathname
  let ext = extname(urlPath).toLowerCase()
  if (!ext || ext.length > 6) ext = '.jpg' // fallback
  // Remove query-string-like suffixes from extension
  ext = ext.split('?')[0]

  return `ext-backup/${category}/${hash}${ext}`
}

function extractExternalUrls(text) {
  if (!text) return []
  const urls = new Set()
  let match
  const re = new RegExp(DOMAIN_RE.source, DOMAIN_RE.flags)
  while ((match = re.exec(text)) !== null) {
    // Clean up trailing punctuation
    let url = match[0].replace(/[,;.!]+$/, '')
    urls.add(url)
  }
  return [...urls]
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET)
  if (!exists) {
    console.log(`Creating bucket '${BUCKET}'...`)
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) {
      console.error(`Failed to create bucket: ${error.message}`)
      process.exit(1)
    }
  }
}

async function fetchAllArticles() {
  let all = []
  let from = 0
  const PAGE = 1000
  while (true) {
    const { data, error } = await supabase
      .from('articles')
      .select('id, slug, content_zh, content_en')
      .eq('status', 'published')
      .range(from, from + PAGE - 1)
    if (error) { console.error(`Fetch error: ${error.message}`); break }
    all = all.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }
  console.log(`Fetched ${all.length} published articles.`)
  return all
}

async function processImage(url) {
  if (urlMapping[url]) {
    return { status: 'skipped', newUrl: urlMapping[url] }
  }

  const storagePath = storagePathFromUrl(url)
  const localPath = resolve(TMP_DIR, storagePath)

  // Download
  try {
    await downloadFile(url, localPath)
  } catch (err) {
    return { status: 'error', error: `Download: ${err.message}` }
  }

  if (DRY_RUN) {
    const newUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`
    return { status: 'dry-run', newUrl }
  }

  // Upload to Supabase Storage
  const fileBuffer = readFileSync(localPath)
  const contentType = guessContentType(localPath)

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, { contentType, upsert: true })

  if (error) {
    return { status: 'error', error: `Upload: ${error.message}` }
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
    console.error(`  Failed to update ${article.slug}: ${error.message}`)
  } else {
    const fields = [zhChanged && 'zh', enChanged && 'en'].filter(Boolean).join('+')
    console.log(`  Updated article: ${article.slug} (${fields})`)
  }
}

async function main() {
  console.log('=== External Image Migration to Supabase Storage ===')
  console.log(`Targets: ${TARGET_DOMAINS.join(', ')}`)
  if (DRY_RUN) console.log('[DRY RUN] No changes will be written.\n')
  else console.log()

  await ensureBucket()

  const articles = await fetchAllArticles()

  // Collect all unique external URLs
  const allUrls = new Set()
  const articleUrlMap = new Map()

  for (const article of articles) {
    const urls = [
      ...extractExternalUrls(article.content_zh),
      ...extractExternalUrls(article.content_en),
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

  console.log(`\nFound ${totalUrls} unique external image URLs across ${articleUrlMap.size} articles.`)

  // Breakdown by domain
  const byDomain = {}
  for (const url of allUrls) {
    const cat = domainCategory(url)
    byDomain[cat] = (byDomain[cat] || 0) + 1
  }
  for (const [cat, count] of Object.entries(byDomain)) {
    console.log(`  ${cat}: ${count} URLs`)
  }

  console.log(`\nAlready migrated: ${alreadyMapped}`)
  console.log(`To process this run: ${batch.length}`)
  if (toProcess.length > MAX_IMAGES) {
    console.log(`Remaining after this run: ${toProcess.length - MAX_IMAGES}`)
  }
  console.log()

  // Process images
  let uploaded = 0, skipped = 0, errors = 0
  const errorDetails = []

  for (let i = 0; i < batch.length; i++) {
    const url = batch[i]
    const progress = `[${i + 1}/${batch.length}]`

    const result = await processImage(url)

    switch (result.status) {
      case 'uploaded':
        uploaded++
        console.log(`${progress} OK    ${domainCategory(url)} → ${result.newUrl.split('/').pop()}`)
        break
      case 'dry-run':
        uploaded++
        console.log(`${progress} DRY   ${url.slice(0, 60)}...`)
        break
      case 'skipped':
        skipped++
        break
      case 'error':
        errors++
        errorDetails.push({ url, error: result.error })
        console.error(`${progress} ERR   ${url.slice(0, 60)}... — ${result.error}`)
        break
    }

    if (i < batch.length - 1) {
      await sleep(RATE_LIMIT_MS)
    }
  }

  console.log(`\n--- Image processing complete ---`)
  console.log(`Uploaded: ${uploaded}  Skipped: ${skipped}  Errors: ${errors}`)

  // Update article content
  if (!SKIP_UPDATE && !DRY_RUN && Object.keys(urlMapping).length > 0) {
    console.log('\n--- Updating article content ---')
    for (const article of articles) {
      const articleUrls = articleUrlMap.get(article.id)
      if (!articleUrls) continue

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

  // Summary
  console.log('\n=== Summary ===')
  console.log(`Total external image URLs: ${totalUrls}`)
  console.log(`Migrated (all time):       ${Object.keys(urlMapping).length}`)
  console.log(`Remaining:                 ${totalUrls - Object.keys(urlMapping).length}`)

  if (errorDetails.length > 0) {
    console.log('\n--- Failed URLs ---')
    for (const { url, error } of errorDetails) {
      console.log(`  ${url}`)
      console.log(`    → ${error}`)
    }
  }

  if (Object.keys(urlMapping).length > 0) {
    console.log(`\nMapping file: ${MAPPING_FILE}`)
  }

  // Verify sample
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
