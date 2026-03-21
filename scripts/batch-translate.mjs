/**
 * Batch translate Chinese articles to English using OpenAI API.
 * Follows the 10 translation rules from 写作风格分析.md.
 *
 * Usage:
 *   node scripts/batch-translate.mjs                    # translate all untranslated drafts
 *   node scripts/batch-translate.mjs --slug at-forty    # translate specific article
 *   node scripts/batch-translate.mjs --dry-run          # preview without writing
 *
 * Requires .env.local with OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import https from 'https'

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
const OPENAI_KEY = env.OPENAI_API_KEY

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const slugArg = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null

// ───────────────── Translation System Prompt ─────────────────

const SYSTEM_PROMPT = `You are translating personal blog articles from Chinese to English for johngai.com.

## Author Profile
John Wei (魏智勇) — Senior DevOps/AI engineer, 40s, based in Hong Kong. His writing blends engineering precision with literary sensibility. He's influenced by Murakami, Márquez, classical Chinese poetry, and pop culture equally.

## 10 Translation Rules (MANDATORY)

1. **Scene verbs first, emotion words later.** If the original is a scene, complete the scene in English before adding any emotional interpretation. Never insert feeling-words into action sentences.

2. **"大概" → "something like" or keep vague.** John's "大概" is emotional fuzziness, not numerical approximation. Never use "approximately."

3. **Classical idioms: preserve the image, not the literal words.** Example: "如鱼饮水，冷暖自知" → "only the fish knows how the water feels"

4. **Quotations stay as the author remembers them.** Don't correct or standardize literary references.

5. **Asymmetric translation of transition words.** "但是" is not always "but": light shift → "but/though"; strong shift → "yet/and yet"; emotional shift → "still/even so"

6. **Preserve acceleration in enumerations.** Three-item buildups should use punctuation rhythm, not "firstly/secondly/thirdly." End with "and the rest, too many to count" style.

7. **Titles: keep them short.** No subtitles, no explanations. "走出挪威的森林" → "Leaving the Forest", not "Walking Out of Norwegian Wood: My Journey with Murakami"

8. **Preserve humor and self-deprecation in tech articles.** John's technical humor is how he connects with readers. Don't flatten it into neutral tech prose.

9. **Keep time expressions precise.** "51年9个月又4天" → "fifty-one years, nine months, and four days", never "over fifty years"

10. **Endings stay flat.** If the original ends with a plain statement, the English must too. Never add uplift, hope, or summary that wasn't there.

## Anti-patterns (NEVER do these)
- "In this article, I will explore..."
- "It is worth noting that..."
- "In conclusion, we can see that..."
- "Many people find that..."
- "This remarkable/significant experience..."
- Stacking adjectives: "truly remarkable", "deeply profound"
- Topic sentences at paragraph openings
- Self-praise: "In this thought-provoking piece..."

## Voice Target
Sound like a clear-thinking Asian intellectual writing in English — not a native speaker, not AI. Think Ha Jin or Yiyun Li's prose style, with an engineer's precision underneath.

## Output Format
Return ONLY the translated English text. No commentary, no notes, no markdown code fences.`

// ───────────────── OpenAI API Call ─────────────────

function callOpenAI(messages, model = 'gpt-4o') {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 8000 })
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          try {
            const r = JSON.parse(data)
            if (r.error) return reject(new Error(r.error.message))
            resolve(r.choices?.[0]?.message?.content ?? '')
          } catch (e) {
            reject(new Error('Failed to parse OpenAI response'))
          }
        })
      }
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ───────────────── Translation Functions ─────────────────

async function translateContent(chineseContent, chineseTitle) {
  const prompt = `Translate the following Chinese blog article into English. The article title is "${chineseTitle}".

Follow ALL 10 translation rules from your instructions. This is a personal essay, not a news article — preserve the author's voice, rhythm, and literary references.

Chinese original:

${chineseContent}`

  return callOpenAI([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ])
}

async function translateTitle(chineseTitle) {
  const prompt = `Translate this Chinese blog article title to English. Keep it SHORT and evocative (2-5 words max). No subtitles. No explanations. Return ONLY the English title.

Chinese title: ${chineseTitle}`

  return callOpenAI([
    { role: 'system', content: 'You translate Chinese blog titles to short, evocative English titles. Return only the title, nothing else.' },
    { role: 'user', content: prompt },
  ])
}

async function generateExcerpts(chineseContent, englishContent, chineseTitle, englishTitle) {
  const prompt = `Generate two excerpts for a blog article:

1. Chinese excerpt (≤150 characters): A compelling summary that makes readers want to click. NOT the first paragraph — write an independent summary.
2. English excerpt (≤150 words): Same purpose, in English.

Chinese title: ${chineseTitle}
English title: ${englishTitle}

Chinese content (first 500 chars): ${chineseContent.slice(0, 500)}
English content (first 500 chars): ${englishContent.slice(0, 500)}

Return in this exact format (no other text):
ZH: [chinese excerpt]
EN: [english excerpt]`

  const result = await callOpenAI([
    { role: 'system', content: 'You write compelling blog article excerpts. Be concise and intriguing.' },
    { role: 'user', content: prompt },
  ])

  const zhMatch = result.match(/ZH:\s*(.+)/s)
  const enMatch = result.match(/EN:\s*(.+)/s)
  return {
    excerpt_zh: zhMatch?.[1]?.trim().slice(0, 200) ?? '',
    excerpt_en: enMatch?.[1]?.trim().slice(0, 500) ?? '',
  }
}

function calcReadingTime(zh, en) {
  const zhChars = (zh || '').replace(/\s/g, '').length
  const enWords = (en || '').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(Math.max(zhChars / 500, enWords / 200)))
}

// ───────────────── Main ─────────────────

async function main() {
  console.log('Batch Translation Pipeline')
  console.log('==========================\n')

  // Fetch articles that need translation
  let query = supabase
    .from('articles')
    .select('*')
    .order('published_at', { ascending: true })

  if (slugArg) {
    query = query.eq('slug', slugArg)
  } else {
    // Find articles with Chinese content but no English content
    query = query
      .not('content_zh', 'is', null)
      .or('content_en.is.null,content_en.eq.')
  }

  const { data: articles, error } = await query

  if (error) {
    console.error('Failed to fetch articles:', error.message)
    process.exit(1)
  }

  if (!articles || articles.length === 0) {
    console.log('No articles need translation.')
    return
  }

  console.log(`Found ${articles.length} articles to translate.\n`)

  let ok = 0
  let fail = 0

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i]
    const title = a.title_zh || a.slug
    process.stdout.write(`[${i + 1}/${articles.length}] ${title.slice(0, 40).padEnd(40)} `)

    if (DRY_RUN) {
      console.log('(dry run — skipped)')
      continue
    }

    try {
      // 1. Translate title if missing
      let titleEn = a.title_en
      if (!titleEn) {
        titleEn = await translateTitle(a.title_zh)
        titleEn = titleEn.replace(/^["']|["']$/g, '').trim()
        process.stdout.write('T ')
      }

      // 2. Translate content
      const contentEn = await translateContent(a.content_zh, a.title_zh)
      process.stdout.write('C ')

      // 3. Generate excerpts if missing
      let excerptZh = a.excerpt_zh
      let excerptEn = a.excerpt_en
      if (!excerptZh || !excerptEn) {
        const excerpts = await generateExcerpts(a.content_zh, contentEn, a.title_zh, titleEn)
        if (!excerptZh) excerptZh = excerpts.excerpt_zh
        if (!excerptEn) excerptEn = excerpts.excerpt_en
        process.stdout.write('E ')
      }

      // 4. Update in Supabase
      const updates = {
        title_en: titleEn,
        content_en: contentEn,
        excerpt_en: excerptEn,
        updated_at: new Date().toISOString(),
        reading_time_min: calcReadingTime(a.content_zh, contentEn),
      }
      if (!a.excerpt_zh && excerptZh) updates.excerpt_zh = excerptZh

      const { error: updateError } = await supabase
        .from('articles')
        .update(updates)
        .eq('id', a.id)

      if (updateError) throw new Error(updateError.message)

      console.log(`✓ "${titleEn}"`)
      ok++
    } catch (e) {
      console.log(`✗ ${e.message}`)
      fail++
    }

    // Rate limiting — 2s between articles
    if (i < articles.length - 1) {
      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  console.log(`\n✅ Done: ${ok} translated, ${fail} failed`)
}

main().catch(console.error)
