#!/usr/bin/env node
/**
 * Batch translate articles using OpenAI GPT-4o API.
 * Reads cleaned Chinese markdown, outputs English translations.
 * Runs 8 concurrent translations for speed.
 *
 * Usage: node scripts/batch-translate-gpt.mjs [--limit N] [--model gpt-4o-mini]
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const https = require('https');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) { console.error('Missing OPENAI_API_KEY'); process.exit(1); }

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 999;
const modelIdx = args.indexOf('--model');
const MODEL = modelIdx >= 0 ? args[modelIdx + 1] : 'gpt-5.4';
const concIdx = args.indexOf('--concurrency');
const CONCURRENCY = concIdx >= 0 ? parseInt(args[concIdx + 1]) : 3;

const BASE = '/workspace/extra/repos/johngai-blog/content';

const SYSTEM_PROMPT = `You are an expert Chinese-to-English literary translator for a personal blog by John Wei (魏智勇), a DevOps engineer from China living in Hong Kong.

## MANDATORY Translation Rules
1. Action verbs first, emotional words later — lead with what happened, not how it felt
2. "大概" → "something like", NEVER "approximately"
3. Classical poetry: preserve imagery and feeling, not literal word-by-word meaning
4. Quotes from memory — don't fact-check or correct them
5. Varied transition words: rotate through but/yet/still/even so/though — never repeat the same one twice in a row
6. Lists keep acceleration feel — don't convert to numbered lists
7. Titles: concise, no explanation or subtitle bloat
8. Tech articles: preserve self-deprecation and humor — the author jokes about his own mistakes
9. Time expressions: keep them precise ("3:47 AM", not "late at night")
10. Endings: NO elevation, NO summary, NO "in conclusion". Just stop where the author stops.

## Anti-patterns (NEVER use these phrases)
- "In this article, I will explore..."
- "It is worth noting that..."
- "In conclusion..."
- "As we can see..."
- "Let's dive in..."
- "Without further ado..."
- Any phrase that sounds like corporate blog or AI-generated content

## Output Format
Return ONLY a JSON object (no markdown code fence):
{
  "title_en": "English title (concise, no explanation)",
  "excerpt_zh": "中文摘要，不超过150字",
  "excerpt_en": "English excerpt, max 150 words. Written independently, not a translation of the Chinese excerpt.",
  "content_en": "The full English translation in markdown format"
}

## Style Notes
- This is a PERSONAL blog — warm, honest, sometimes rambling, sometimes sharp
- Short pieces (poems, reflections) should stay short — don't pad them
- Technical articles mix professional knowledge with personal anecdotes
- The author switches between contemplative and humorous — match the tone of each piece`;

function httpPost(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 180000,
    }, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        resolve({ status: res.statusCode, text });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(data);
    req.end();
  });
}

async function callOpenAI(userPrompt, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { status, text } = await httpPost({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_completion_tokens: 16000,
        response_format: { type: 'json_object' },
      });

      if (status === 429) {
        const wait = Math.pow(2, attempt + 1) * 1000;
        console.log(`  Rate limited, waiting ${wait/1000}s...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      if (status !== 200) {
        throw new Error(`API ${status}: ${text.slice(0, 200)}`);
      }

      const data = JSON.parse(text);
      const content = data.choices[0].message.content;
      const usage = data.usage;
      return { result: JSON.parse(content), usage };
    } catch (e) {
      if (attempt === retries) throw e;
      console.log(`  Retry ${attempt + 1}: ${e.message.slice(0, 200)}`);
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
}

async function translateArticle(article, index) {
  const cleanedPath = join(BASE, article.files.cleaned);
  const raw = readFileSync(cleanedPath, 'utf-8');

  // Extract content after frontmatter
  const parts = raw.split('---');
  const content = parts.length >= 3 ? parts.slice(2).join('---').trim() : raw;
  const title = article.title_zh;

  const userPrompt = `Translate this Chinese blog article to English.

Title: ${title}
Category: ${article.category}
Original date: ${article.original_date || 'unknown'}

---
${content}
---

Remember: translate naturally following all 10 rules. For very short pieces (poems, reflections), keep them short. Return JSON only.`;

  try {
    const { result, usage } = await callOpenAI(userPrompt);

    // Write translated file
    const slug = article.slug;
    const outPath = join(BASE, 'translated', `${slug}-en.md`);
    const outContent = `---
title_en: "${(result.title_en || '').replace(/"/g, '\\"')}"
excerpt_zh: "${(result.excerpt_zh || '').replace(/"/g, '\\"')}"
excerpt_en: "${(result.excerpt_en || '').replace(/"/g, '\\"')}"
translated_at: "2026-03-20"
model: "${MODEL}"
---

${result.content_en || ''}`;

    writeFileSync(outPath, outContent, 'utf-8');

    // Update index entry
    article.status = 'translated';
    article.files.translated = `translated/${slug}-en.md`;
    article.timestamps.translated_at = '2026-03-20T12:10:00Z';

    return {
      slug,
      title: title.slice(0, 30),
      title_en: (result.title_en || '').slice(0, 40),
      tokens: usage.total_tokens,
      ok: true,
    };
  } catch (e) {
    return {
      slug: article.slug,
      title: title.slice(0, 30),
      error: e.message.slice(0, 100),
      ok: false,
    };
  }
}

async function main() {
  console.log(`Model: ${MODEL}, Concurrency: ${CONCURRENCY}, Limit: ${LIMIT}`);

  const index = JSON.parse(readFileSync(join(BASE, 'index.json'), 'utf-8'));

  // Find articles to translate
  const todo = index.articles
    .filter(a => a.status === 'cleaned' && a.files.cleaned)
    .slice(0, LIMIT);

  console.log(`Found ${todo.length} articles to translate\n`);

  let totalTokens = 0;
  let done = 0;
  let errors = 0;
  const results = [];

  // Process in batches of CONCURRENCY
  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    const batch = todo.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;
    const totalBatches = Math.ceil(todo.length / CONCURRENCY);
    console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} articles)...`);

    const batchResults = await Promise.all(
      batch.map(article => translateArticle(article, index))
    );

    for (const r of batchResults) {
      results.push(r);
      if (r.ok) {
        done++;
        totalTokens += r.tokens || 0;
        process.stdout.write(`  ✓ ${r.title} → ${r.title_en} (${r.tokens} tokens)\n`);
      } else {
        errors++;
        process.stdout.write(`  ✗ ${r.title}: ${r.error}\n`);
      }
    }

    // Save index after each batch (incremental save)
    const statusCounts = {};
    for (const a of index.articles) {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    }
    index.stats.by_status = statusCounts;
    index.updated_at = new Date().toISOString();
    writeFileSync(join(BASE, 'index.json'), JSON.stringify(index, null, 2));

    console.log(`  Saved. Progress: ${done}/${todo.length}\n`);
  }

  // Final summary
  console.log('='.repeat(50));
  console.log('TRANSLATION COMPLETE');
  console.log('='.repeat(50));
  console.log(`Translated: ${done}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total tokens: ${totalTokens.toLocaleString()}`);

  // Estimate cost
  const inputCost = (totalTokens * 0.6) * 2.5 / 1_000_000;  // ~60% input
  const outputCost = (totalTokens * 0.4) * 10 / 1_000_000;   // ~40% output
  const totalCost = inputCost + outputCost;
  console.log(`Estimated cost: $${totalCost.toFixed(2)} (${MODEL})`);

  const finalStatus = {};
  for (const a of index.articles) {
    finalStatus[a.status] = (finalStatus[a.status] || 0) + 1;
  }
  console.log('\nFinal status:');
  for (const [s, n] of Object.entries(finalStatus).sort()) {
    console.log(`  ${s}: ${n}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
