#!/usr/bin/env node
/**
 * Re-translate articles with style-aware prompts using azure-global/gpt-5.1.
 *
 * Targets published articles originally translated by gpt-4o (lower quality).
 * Reads 中文 originals and produces English translations that match the author's
 * personal writing voice.
 *
 * Usage:
 *   node scripts/retranslate-style-aware.mjs --dry-run   # list candidates only
 *   node scripts/retranslate-style-aware.mjs              # re-translate all
 *   node scripts/retranslate-style-aware.mjs --limit 10   # re-translate first 10
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { resolve, dirname, join } from 'path'
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
const limitIdx = process.argv.indexOf('--limit')
const LIMIT = limitIdx >= 0 ? parseInt(process.argv[limitIdx + 1]) : 999

// ── LLM Gateway config ──────────────────────────────────────────
const LLM_GATEWAY = 'https://llm.ngaisy.com/chat/completions'
const LLM_KEY = 'sk-homelab-2026'
const LLM_MODEL = 'azure-global/gpt-5.1'
const RATE_LIMIT_MS = 3000

// ── Author's writing style (extracted from 5 original Chinese articles) ──
const STYLE_GUIDANCE = `
## Author Voice Profile (John Wei / 魏智勇)

You are translating for a Chinese engineer-writer who has a distinctive personal voice.
His writing blends technical precision with literary sensibility. Key characteristics:

### Sentence Patterns
- Alternates between long, flowing contemplative sentences and short punchy observations
- Uses em-dashes and parenthetical asides naturally
- Paragraphs often start with a concrete image or action, then expand into reflection

### Tone & Register
- Warm, intimate first-person narrative — like talking to a close friend over drinks
- Self-deprecating humor about his own technical breadth ("one Dragon engineer")
- Never corporate, never academic, never AI-sounding
- Comfortable with ambiguity and unanswered questions

### Cultural & Literary Style
- Freely references Murakami, Garcia Marquez, Luc Besson, 98 Degrees in the same breath
- Classical Chinese poetry references should preserve imagery, not literal meaning
- Colloquial expressions should map to equivalent casual English, not formal equivalents
  e.g. "搞技术" → "doing tech stuff", NOT "engaged in technological pursuits"
  e.g. "门门都通" → "a jack of all trades", NOT "proficient in all disciplines"

### What to AVOID (anti-patterns from previous translations)
- "In this article, I will explore..." — NEVER
- "It is worth noting that..." — NEVER
- "Let's delve into..." — NEVER
- "comprehensive", "multifaceted", "pivotal", "realm", "tapestry" — corporate cliches
- Overly tidy conclusions or summaries — the author often just stops
- Converting natural paragraph flow into numbered lists
- Making emotional passages more "professional"

### Technical Articles
- The author mixes professional knowledge with personal anecdotes and jokes
- Keep the self-deprecation ("我也不知道怎么搞的" → "I honestly have no idea how it happened")
- Preserve exact version numbers, timestamps, error messages
- Code blocks stay untouched
`

const SYSTEM_PROMPT = `You are an expert Chinese-to-English literary translator for a personal blog.

${STYLE_GUIDANCE}

## Translation Rules
1. Action verbs first, emotional words later — lead with what happened
2. "大概" → "something like", NEVER "approximately"
3. Classical poetry: preserve imagery and feeling, not literal word-by-word meaning
4. Quotes from memory — don't fact-check or correct them
5. Varied transition words: rotate through but/yet/still/even so/though
6. Lists keep acceleration feel — don't convert to numbered lists
7. Titles: concise, no explanation or subtitle bloat
8. Tech articles: preserve self-deprecation and humor
9. Time expressions: keep them precise ("3:47 AM", not "late at night")
10. Endings: NO elevation, NO summary, NO "in conclusion". Just stop where the author stops.

## Output
Return ONLY the translated English markdown. No preamble, no explanations.
Keep all markdown formatting (headings, code blocks, lists, links, images) intact.`

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function translate(text, retries = 2) {
  const maxInput = 10000
  let inputText = text
  if (text.length > maxInput) {
    console.log(`    (truncating ${text.length}c → ${maxInput}c)`)
    inputText = text.substring(0, maxInput) + '\n\n[... content truncated ...]'
  }

  const maxTokens = Math.min(12000, Math.max(3000, Math.ceil(inputText.length * 1.8)))

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`    (retry ${attempt}/${retries})`)
        await sleep(5000 * attempt)
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 180000) // 3min timeout

      const bodyPayload = {
        model: LLM_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Translate this Chinese blog article to English:\n\n${inputText}` },
        ],
        max_tokens: maxTokens,
      }
      // GPT-5 family only supports temperature=1
      if (!LLM_MODEL.includes('gpt-5')) {
        bodyPayload.temperature = 0.7
      }

      const resp = await fetch(LLM_GATEWAY, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LLM_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!resp.ok) {
        const body = await resp.text()
        if (attempt < retries && (resp.status === 502 || resp.status === 503 || resp.status === 429)) {
          continue
        }
        throw new Error(`LLM Gateway ${resp.status}: ${body.substring(0, 200)}`)
      }

      const data = await resp.json()
      return data.choices?.[0]?.message?.content?.trim() || null
    } catch (e) {
      if (attempt < retries && (e.name === 'AbortError' || e.message.includes('fetch failed'))) {
        continue
      }
      throw e
    }
  }
  return null
}

async function translateShort(text) {
  const resp = await fetch(LLM_GATEWAY, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LLM_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: 'Translate to English. Match the tone of a personal blog — warm and natural. Output only the translation.' },
        { role: 'user', content: text },
      ],
      max_tokens: 500,
    }),
  })

  if (!resp.ok) throw new Error(`LLM Gateway ${resp.status}`)
  const data = await resp.json()
  return data.choices?.[0]?.message?.content?.trim() || null
}

// ── Find candidates ─────────────────────────────────────────────
function findGpt4oSlugs() {
  const dir = resolve(__dirname, '..', 'content', 'translated')
  const files = readdirSync(dir)
  const slugs = new Set()

  for (const f of files) {
    const content = readFileSync(join(dir, f), 'utf-8')
    const modelMatch = content.match(/^model:\s*"(.+?)"/m)
    if (modelMatch && modelMatch[1] === 'gpt-4o') {
      slugs.add(f.replace(/-en\.md$/, ''))
    }
  }
  return slugs
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Model: ${LLM_MODEL}`)
  console.log(`Limit: ${LIMIT}\n`)

  // Find gpt-4o translated slugs
  const gpt4oSlugs = findGpt4oSlugs()
  console.log(`Found ${gpt4oSlugs.size} articles translated with gpt-4o in file system\n`)

  // Fetch published articles
  let allArticles = []
  let from = 0
  while (true) {
    const { data } = await supabase
      .from('articles')
      .select('id,slug,title_zh,title_en,content_zh,content_en,excerpt_zh,excerpt_en')
      .eq('status', 'published')
      .range(from, from + 999)
    allArticles = allArticles.concat(data)
    if (data.length < 1000) break
    from += 1000
  }

  // Match: published articles whose slug is in the gpt-4o set AND has zh content
  const candidates = allArticles
    .filter(a => gpt4oSlugs.has(a.slug) && (a.content_zh || '').length > 200)
    .slice(0, LIMIT)

  console.log(`Candidates for re-translation: ${candidates.length}\n`)

  if (dryRun) {
    for (const a of candidates) {
      const zhLen = (a.content_zh || '').length
      const enLen = (a.content_en || '').length
      console.log(`  ${(a.title_zh || a.slug).substring(0, 60)}  [zh:${zhLen} en:${enLen}]`)
    }
    console.log('\nDry run complete. Run without --dry-run to re-translate.')
    return
  }

  // Re-translate
  let translated = 0
  let errors = 0
  const report = []

  for (let i = 0; i < candidates.length; i++) {
    const a = candidates[i]
    const progress = `[${i + 1}/${candidates.length}]`
    const label = (a.title_zh || a.slug).substring(0, 50)

    try {
      console.log(`${progress} Re-translating: ${label}`)

      // Translate content
      const newEn = await translate(a.content_zh)
      if (!newEn || newEn.length < 100) {
        console.log(`  SKIP: translation too short (${(newEn || '').length}c)`)
        errors++
        report.push({ id: a.id, slug: a.slug, action: 'SKIP_SHORT' })
        await sleep(RATE_LIMIT_MS)
        continue
      }

      const updates = {
        content_en: newEn,
        updated_at: new Date().toISOString(),
      }

      // Re-translate title if needed
      if (a.title_zh) {
        try {
          const newTitleEn = await translateShort(a.title_zh)
          if (newTitleEn) updates.title_en = newTitleEn
          await sleep(RATE_LIMIT_MS)
        } catch (e) { /* skip title */ }
      }

      // Re-translate excerpt if needed
      if (a.excerpt_zh) {
        try {
          const newExcerptEn = await translateShort(a.excerpt_zh)
          if (newExcerptEn) updates.excerpt_en = newExcerptEn
          await sleep(RATE_LIMIT_MS)
        } catch (e) { /* skip excerpt */ }
      }

      const { error: err } = await supabase.from('articles').update(updates).eq('id', a.id)
      if (err) {
        console.log(`  DB ERROR: ${err.message}`)
        errors++
        report.push({ id: a.id, slug: a.slug, action: 'DB_FAIL', error: err.message })
      } else {
        const oldLen = (a.content_en || '').length
        console.log(`  OK: ${oldLen}c → ${newEn.length}c`)
        translated++
        report.push({ id: a.id, slug: a.slug, action: 'RETRANSLATED', oldLen, newLen: newEn.length })
      }
    } catch (e) {
      console.log(`  ERROR: ${e.message}`)
      errors++
      report.push({ id: a.id, slug: a.slug, action: 'ERROR', error: e.message })
    }

    await sleep(RATE_LIMIT_MS)
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log('RE-TRANSLATION SUMMARY:')
  console.log(`  Candidates:    ${candidates.length}`)
  console.log(`  Re-translated: ${translated}`)
  console.log(`  Errors:        ${errors}`)

  // Save report
  const reportPath = resolve(__dirname, '..', 'retranslation-report.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\nReport saved to: ${reportPath}`)
}

main().catch(console.error)
