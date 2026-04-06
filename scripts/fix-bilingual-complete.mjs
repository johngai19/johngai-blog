/**
 * Comprehensive bilingual content fix for johngai-blog.
 *
 * Audits ALL published articles, detects language issues, fixes swapped content,
 * and translates missing content using the homelab LLM Gateway.
 *
 * Usage:
 *   node scripts/fix-bilingual-complete.mjs --dry-run   # audit only
 *   node scripts/fix-bilingual-complete.mjs              # audit + fix + translate
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Load .env.local ──────────────────────────────────────────────
const envPath = resolve(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim()
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const dryRun = process.argv.includes('--dry-run')

// ── LLM Gateway config ──────────────────────────────────────────
const LLM_GATEWAY = 'https://llm.ngaisy.com/chat/completions'
const LLM_KEY = 'sk-homelab-2026'
const LLM_MODEL = 'azure/gpt-4o'
const RATE_LIMIT_MS = 2500 // 2.5s between LLM calls
const MIN_CONTENT_LENGTH = 100 // skip very short content

// ── Language detection ───────────────────────────────────────────
function countCJK(text) {
  if (!text) return 0
  return (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length
}

function detectLang(text) {
  if (!text || text.trim().length < 10) return 'empty'
  const stripped = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '')
    .replace(/https?:\/\/\S+/g, '').replace(/[#*_\-|>]/g, '')
  const cjk = countCJK(stripped)
  const total = stripped.replace(/\s/g, '').length
  if (total < 10) return 'empty'
  const ratio = cjk / total
  if (ratio > 0.15) return 'zh'
  return 'en'
}

// ── LLM translation ─────────────────────────────────────────────
async function translate(text, direction, retries = 2) {
  const systemPrompt = direction === 'en2zh'
    ? 'You are a professional translator. Translate the following English article to natural Chinese. Keep the markdown formatting intact. Only output the translation, no explanations or preamble.'
    : 'You are a professional translator. Translate the following Chinese article to natural English. Keep the markdown formatting intact. Only output the translation, no explanations or preamble.'

  // For very long articles, truncate to avoid timeouts
  const maxInput = 8000
  let inputText = text
  if (text.length > maxInput) {
    console.log(`    (truncating ${text.length}c → ${maxInput}c for translation)`)
    inputText = text.substring(0, maxInput) + '\n\n[... content truncated ...]'
  }

  const maxTokens = Math.min(8000, Math.max(2000, Math.ceil(inputText.length * 1.5)))

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`    (retry ${attempt}/${retries})`)
        await sleep(5000 * attempt) // exponential backoff
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 120000) // 2min timeout

      const resp = await fetch(LLM_GATEWAY, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LLM_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: inputText },
          ],
          max_tokens: maxTokens,
          temperature: 0.3,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!resp.ok) {
        const body = await resp.text()
        if (attempt < retries && (resp.status === 502 || resp.status === 503 || resp.status === 429)) {
          continue // retry on transient errors
        }
        throw new Error(`LLM Gateway ${resp.status}: ${body.substring(0, 200)}`)
      }

      const data = await resp.json()
      return data.choices?.[0]?.message?.content?.trim() || null
    } catch (e) {
      if (attempt < retries && (e.name === 'AbortError' || e.message.includes('fetch failed') || e.message.includes('502') || e.message.includes('503'))) {
        continue
      }
      throw e
    }
  }
  return null
}

async function translateShort(text, direction) {
  // For titles and excerpts — use a more constrained prompt
  const systemPrompt = direction === 'en2zh'
    ? 'Translate to Chinese. Output only the translation, nothing else.'
    : 'Translate to English. Output only the translation, nothing else.'

  const resp = await fetch(LLM_GATEWAY, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LLM_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      max_tokens: 500,
      temperature: 0.2,
    }),
  })

  if (!resp.ok) {
    throw new Error(`LLM Gateway ${resp.status}`)
  }

  const data = await resp.json()
  return data.choices?.[0]?.message?.content?.trim() || null
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log(`Mode: ${dryRun ? 'DRY RUN (audit only)' : 'LIVE (will fix + translate)'}\n`)

  // Fetch ALL published articles
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id,slug,title_zh,title_en,content_zh,content_en,excerpt_zh,excerpt_en,status,category')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch articles:', error)
    process.exit(1)
  }

  console.log(`Total published articles: ${articles.length}\n`)

  // ── Phase 1: Audit ──────────────────────────────────────────
  const categories = {
    OK: [],
    SWAPPED: [],
    MISSING_ZH: [],
    MISSING_EN: [],
    BOTH_EMPTY: [],
    BOTH_EN: [],    // both fields have English
    BOTH_ZH: [],    // both fields have Chinese
  }

  for (const a of articles) {
    const langZh = detectLang(a.content_zh)
    const langEn = detectLang(a.content_en)
    const label = (a.title_en || a.title_zh || a.slug).substring(0, 60)

    if (langZh === 'zh' && langEn === 'en') {
      categories.OK.push({ ...a, _label: label })
    } else if (langZh === 'en' && langEn === 'zh') {
      categories.SWAPPED.push({ ...a, _label: label })
    } else if (langZh === 'en' && langEn === 'en') {
      categories.BOTH_EN.push({ ...a, _label: label })
    } else if (langZh === 'zh' && langEn === 'zh') {
      categories.BOTH_ZH.push({ ...a, _label: label })
    } else if (langZh === 'empty' && langEn === 'empty') {
      categories.BOTH_EMPTY.push({ ...a, _label: label })
    } else if (langZh === 'zh' && langEn === 'empty') {
      categories.MISSING_EN.push({ ...a, _label: label })
    } else if (langZh === 'empty' && langEn === 'en') {
      categories.MISSING_ZH.push({ ...a, _label: label })
    } else if (langZh === 'empty' && langEn === 'zh') {
      // content_en has Chinese, content_zh is empty → move + translate
      categories.SWAPPED.push({ ...a, _label: label, _note: 'en_slot_has_zh' })
    } else if (langZh === 'en' && langEn === 'empty') {
      // content_zh has English, content_en is empty → move + translate
      categories.MISSING_ZH.push({ ...a, _label: label, _note: 'zh_slot_has_en' })
    } else {
      // Catch-all — log for review
      console.log(`  UNKNOWN: [${langZh}/${langEn}] ${label}`)
      categories.OK.push({ ...a, _label: label })
    }
  }

  console.log('=== AUDIT RESULTS ===')
  console.log(`  OK (zh+en correct):     ${categories.OK.length}`)
  console.log(`  SWAPPED (zh↔en):        ${categories.SWAPPED.length}`)
  console.log(`  BOTH_EN (need zh):      ${categories.BOTH_EN.length}`)
  console.log(`  BOTH_ZH (need en):      ${categories.BOTH_ZH.length}`)
  console.log(`  MISSING_ZH (en only):   ${categories.MISSING_ZH.length}`)
  console.log(`  MISSING_EN (zh only):   ${categories.MISSING_EN.length}`)
  console.log(`  BOTH_EMPTY:             ${categories.BOTH_EMPTY.length}`)
  console.log()

  if (dryRun) {
    // Print details for each category
    for (const cat of ['SWAPPED', 'BOTH_EN', 'BOTH_ZH', 'MISSING_ZH', 'MISSING_EN', 'BOTH_EMPTY']) {
      if (categories[cat].length > 0) {
        console.log(`\n--- ${cat} (${categories[cat].length}) ---`)
        for (const a of categories[cat]) {
          const zhLen = (a.content_zh || '').length
          const enLen = (a.content_en || '').length
          console.log(`  ${a._label}  [zh:${zhLen} en:${enLen}]${a._note ? ' (' + a._note + ')' : ''}`)
        }
      }
    }
    console.log('\nDry run complete. Run without --dry-run to apply fixes.')
    return
  }

  // ── Phase 2: Fix swapped content ───────────────────────────
  let fixCount = 0
  let translateCount = 0
  let errorCount = 0
  const report = []

  if (categories.SWAPPED.length > 0) {
    console.log(`\n=== PHASE 2: Fixing ${categories.SWAPPED.length} swapped articles ===`)
    for (const a of categories.SWAPPED) {
      const updates = {
        content_zh: a.content_en,  // swap
        content_en: a.content_zh,
        updated_at: new Date().toISOString(),
      }
      // Also swap titles/excerpts if needed
      const titleZhLang = detectLang(a.title_zh)
      const titleEnLang = detectLang(a.title_en)
      if (titleZhLang === 'en' && titleEnLang === 'zh') {
        updates.title_zh = a.title_en
        updates.title_en = a.title_zh
      }
      const excerptZhLang = detectLang(a.excerpt_zh)
      const excerptEnLang = detectLang(a.excerpt_en)
      if (excerptZhLang === 'en' && excerptEnLang === 'zh') {
        updates.excerpt_zh = a.excerpt_en
        updates.excerpt_en = a.excerpt_zh
      }

      const { error: err } = await supabase.from('articles').update(updates).eq('id', a.id)
      if (err) {
        console.log(`  FAIL swap: ${a._label} — ${err.message}`)
        errorCount++
        report.push({ id: a.id, slug: a.slug, action: 'SWAP_FAIL', error: err.message })
      } else {
        console.log(`  SWAPPED: ${a._label}`)
        fixCount++
        report.push({ id: a.id, slug: a.slug, action: 'SWAPPED' })
      }
    }
  }

  // ── Phase 3: Fix BOTH_EN → keep best English in en, translate to zh ──
  const needZhTranslation = [
    ...categories.BOTH_EN.map(a => ({ ...a, _source: 'BOTH_EN' })),
    ...categories.MISSING_ZH.map(a => ({ ...a, _source: 'MISSING_ZH' })),
  ]

  if (needZhTranslation.length > 0) {
    console.log(`\n=== PHASE 3: Translating ${needZhTranslation.length} articles EN→ZH ===`)
    for (let i = 0; i < needZhTranslation.length; i++) {
      const a = needZhTranslation[i]
      const progress = `[${i + 1}/${needZhTranslation.length}]`

      // Determine the best English content
      let enContent = a.content_en || ''
      let zhContent = a.content_zh || ''

      if (a._source === 'BOTH_EN') {
        // Both are English — use the longer one as content_en
        enContent = (zhContent.length > enContent.length) ? zhContent : enContent
      } else if (a._note === 'zh_slot_has_en') {
        // content_zh has English, content_en is empty
        enContent = zhContent
      }

      if (enContent.length < MIN_CONTENT_LENGTH) {
        console.log(`  ${progress} SKIP (too short ${enContent.length}c): ${a._label}`)
        report.push({ id: a.id, slug: a.slug, action: 'SKIP_SHORT' })
        continue
      }

      try {
        console.log(`  ${progress} Translating EN→ZH: ${a._label}`)
        const translatedZh = await translate(enContent, 'en2zh')
        if (!translatedZh || translatedZh.length < 50) {
          console.log(`    WARN: translation too short, skipping`)
          report.push({ id: a.id, slug: a.slug, action: 'TRANSLATE_FAIL', error: 'result too short' })
          errorCount++
          await sleep(RATE_LIMIT_MS)
          continue
        }

        const updates = {
          content_zh: translatedZh,
          content_en: enContent,
          updated_at: new Date().toISOString(),
        }

        // Translate title if needed
        if (a.title_en && detectLang(a.title_zh) !== 'zh') {
          const titleZh = await translateShort(a.title_en, 'en2zh')
          if (titleZh) updates.title_zh = titleZh
          await sleep(RATE_LIMIT_MS)
        }

        // Translate excerpt if needed
        if (a.excerpt_en && detectLang(a.excerpt_zh) !== 'zh') {
          const excerptZh = await translateShort(a.excerpt_en, 'en2zh')
          if (excerptZh) updates.excerpt_zh = excerptZh
          await sleep(RATE_LIMIT_MS)
        }

        const { error: err } = await supabase.from('articles').update(updates).eq('id', a.id)
        if (err) {
          console.log(`    DB ERROR: ${err.message}`)
          errorCount++
          report.push({ id: a.id, slug: a.slug, action: 'DB_FAIL', error: err.message })
        } else {
          console.log(`    OK (${translatedZh.length}c zh)`)
          translateCount++
          report.push({ id: a.id, slug: a.slug, action: 'TRANSLATED_EN2ZH', zhLen: translatedZh.length })
        }
      } catch (e) {
        console.log(`    ERROR: ${e.message}`)
        errorCount++
        report.push({ id: a.id, slug: a.slug, action: 'TRANSLATE_ERROR', error: e.message })
      }

      await sleep(RATE_LIMIT_MS)
    }
  }

  // ── Phase 4: Fix BOTH_ZH → keep best Chinese in zh, translate to en ──
  const needEnTranslation = [
    ...categories.BOTH_ZH.map(a => ({ ...a, _source: 'BOTH_ZH' })),
    ...categories.MISSING_EN.map(a => ({ ...a, _source: 'MISSING_EN' })),
  ]

  if (needEnTranslation.length > 0) {
    console.log(`\n=== PHASE 4: Translating ${needEnTranslation.length} articles ZH→EN ===`)
    for (let i = 0; i < needEnTranslation.length; i++) {
      const a = needEnTranslation[i]
      const progress = `[${i + 1}/${needEnTranslation.length}]`

      let zhContent = a.content_zh || ''
      let enContent = a.content_en || ''

      if (a._source === 'BOTH_ZH') {
        zhContent = (enContent.length > zhContent.length) ? enContent : zhContent
      }

      if (zhContent.length < MIN_CONTENT_LENGTH) {
        console.log(`  ${progress} SKIP (too short ${zhContent.length}c): ${a._label}`)
        report.push({ id: a.id, slug: a.slug, action: 'SKIP_SHORT' })
        continue
      }

      try {
        console.log(`  ${progress} Translating ZH→EN: ${a._label}`)
        const translatedEn = await translate(zhContent, 'zh2en')
        if (!translatedEn || translatedEn.length < 50) {
          console.log(`    WARN: translation too short, skipping`)
          report.push({ id: a.id, slug: a.slug, action: 'TRANSLATE_FAIL', error: 'result too short' })
          errorCount++
          await sleep(RATE_LIMIT_MS)
          continue
        }

        const updates = {
          content_en: translatedEn,
          content_zh: zhContent,
          updated_at: new Date().toISOString(),
        }

        // Translate title if needed
        if (a.title_zh && detectLang(a.title_en) !== 'en') {
          const titleEn = await translateShort(a.title_zh, 'zh2en')
          if (titleEn) updates.title_en = titleEn
          await sleep(RATE_LIMIT_MS)
        }

        // Translate excerpt if needed
        if (a.excerpt_zh && detectLang(a.excerpt_en) !== 'en') {
          const excerptEn = await translateShort(a.excerpt_zh, 'zh2en')
          if (excerptEn) updates.excerpt_en = excerptEn
          await sleep(RATE_LIMIT_MS)
        }

        const { error: err } = await supabase.from('articles').update(updates).eq('id', a.id)
        if (err) {
          console.log(`    DB ERROR: ${err.message}`)
          errorCount++
          report.push({ id: a.id, slug: a.slug, action: 'DB_FAIL', error: err.message })
        } else {
          console.log(`    OK (${translatedEn.length}c en)`)
          translateCount++
          report.push({ id: a.id, slug: a.slug, action: 'TRANSLATED_ZH2EN', enLen: translatedEn.length })
        }
      } catch (e) {
        console.log(`    ERROR: ${e.message}`)
        errorCount++
        report.push({ id: a.id, slug: a.slug, action: 'TRANSLATE_ERROR', error: e.message })
      }

      await sleep(RATE_LIMIT_MS)
    }
  }

  // ── Phase 5: Fix titles and excerpts for OK articles ───────
  console.log(`\n=== PHASE 5: Fix titles/excerpts for already-correct articles ===`)
  let metaFixCount = 0
  const allFixed = [...categories.OK, ...categories.SWAPPED]
  for (let i = 0; i < allFixed.length; i++) {
    const a = allFixed[i]
    const updates = {}
    let needsUpdate = false

    // Title fixes
    if (a.title_zh && detectLang(a.title_zh) === 'en' && detectLang(a.title_en) !== 'en') {
      // title_zh is English, title_en is not — swap
      updates.title_en = a.title_zh
      updates.title_zh = a.title_en || null
      needsUpdate = true
    } else if (a.title_en && detectLang(a.title_en) === 'zh' && detectLang(a.title_zh) !== 'zh') {
      updates.title_zh = a.title_en
      updates.title_en = a.title_zh || null
      needsUpdate = true
    }

    // Missing title translations
    if (!updates.title_zh && a.title_en && (!a.title_zh || detectLang(a.title_zh) !== 'zh')) {
      try {
        const t = await translateShort(a.title_en, 'en2zh')
        if (t) { updates.title_zh = t; needsUpdate = true }
        await sleep(RATE_LIMIT_MS)
      } catch (e) { /* skip */ }
    }
    if (!updates.title_en && a.title_zh && (!a.title_en || detectLang(a.title_en) !== 'en')) {
      try {
        const t = await translateShort(a.title_zh, 'zh2en')
        if (t) { updates.title_en = t; needsUpdate = true }
        await sleep(RATE_LIMIT_MS)
      } catch (e) { /* skip */ }
    }

    // Excerpt fixes
    if (a.excerpt_zh && detectLang(a.excerpt_zh) === 'en' && detectLang(a.excerpt_en) !== 'en') {
      updates.excerpt_en = a.excerpt_zh
      updates.excerpt_zh = a.excerpt_en || null
      needsUpdate = true
    } else if (a.excerpt_en && detectLang(a.excerpt_en) === 'zh' && detectLang(a.excerpt_zh) !== 'zh') {
      updates.excerpt_zh = a.excerpt_en
      updates.excerpt_en = a.excerpt_zh || null
      needsUpdate = true
    }

    // Missing excerpt translations
    if (!updates.excerpt_zh && a.excerpt_en && (!a.excerpt_zh || detectLang(a.excerpt_zh) !== 'zh')) {
      try {
        const t = await translateShort(a.excerpt_en, 'en2zh')
        if (t) { updates.excerpt_zh = t; needsUpdate = true }
        await sleep(RATE_LIMIT_MS)
      } catch (e) { /* skip */ }
    }
    if (!updates.excerpt_en && a.excerpt_zh && (!a.excerpt_en || detectLang(a.excerpt_en) !== 'en')) {
      try {
        const t = await translateShort(a.excerpt_zh, 'zh2en')
        if (t) { updates.excerpt_en = t; needsUpdate = true }
        await sleep(RATE_LIMIT_MS)
      } catch (e) { /* skip */ }
    }

    if (needsUpdate) {
      updates.updated_at = new Date().toISOString()
      const { error: err } = await supabase.from('articles').update(updates).eq('id', a.id)
      if (!err) {
        metaFixCount++
        const label = (a.title_en || a.title_zh || a.slug).substring(0, 50)
        console.log(`  META FIX: ${label} [${Object.keys(updates).filter(k => k !== 'updated_at').join(',')}]`)
        report.push({ id: a.id, slug: a.slug, action: 'META_FIX', fields: Object.keys(updates) })
      }
    }
  }

  // ── Summary ────────────────────────────────────────────────
  console.log(`\n${'='.repeat(60)}`)
  console.log(`SUMMARY:`)
  console.log(`  Total articles:    ${articles.length}`)
  console.log(`  Already OK:        ${categories.OK.length}`)
  console.log(`  Swapped:           ${fixCount}`)
  console.log(`  Translated:        ${translateCount}`)
  console.log(`  Meta fixes:        ${metaFixCount}`)
  console.log(`  Errors:            ${errorCount}`)
  console.log(`  Skipped (empty):   ${categories.BOTH_EMPTY.length}`)

  // Save report
  const reportPath = resolve(__dirname, '..', 'bilingual-fix-report.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\nReport saved to: ${reportPath}`)
}

main().catch(console.error)
