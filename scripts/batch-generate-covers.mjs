#!/usr/bin/env node
/**
 * Batch generate cover images using OpenAI DALL-E 3.
 * Reads article metadata from index.json, generates cover images.
 * Downloads to content/covers/{slug}.png
 *
 * Usage: node scripts/batch-generate-covers.mjs [--limit N] [--concurrency 2]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) { console.error('Missing OPENAI_API_KEY'); process.exit(1); }

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 999;
const concIdx = args.indexOf('--concurrency');
const CONCURRENCY = concIdx >= 0 ? parseInt(args[concIdx + 1]) : 2; // DALL-E is slow, keep low
const skipTranslated = args.includes('--skip-untranslated');

const BASE = '/workspace/extra/repos/johngai-blog/content';

// Category-specific style hints
const CATEGORY_STYLES = {
  engineering: 'minimalist tech illustration, clean lines, circuit board patterns, code elements, dark blue and cyan palette',
  industry: 'abstract business visualization, data flow, geometric shapes, professional blue and grey palette',
  books: 'warm literary illustration, open book, reading atmosphere, soft warm lighting, amber and cream palette',
  life: 'personal photography style, warm natural light, everyday moments, nostalgic film grain, earth tones',
  startup: 'dynamic startup energy, rocket or growth metaphor, bold colors, orange and white palette',
  writing: 'contemplative ink wash painting style, Chinese brush strokes, minimalist, black ink on rice paper texture',
};

function buildPrompt(article) {
  const category = article.category || 'writing';
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.writing;
  const title = article.title_zh || '';

  // Build a concise image prompt from the article
  return `Create a blog cover image (landscape 1792x1024). Style: ${style}.
Theme inspired by the article title: "${title}".
Requirements: NO text, NO words, NO letters in the image. Abstract or symbolic representation only.
Clean composition suitable for a modern bilingual blog header.`;
}

async function generateCover(article, retries = 2) {
  const slug = article.slug;
  const outPath = join(BASE, 'covers', `${slug}.png`);

  // Skip if already exists
  if (existsSync(outPath)) {
    return { slug, ok: true, skipped: true };
  }

  const prompt = buildPrompt(article);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1792x1024',
          quality: 'standard',
          response_format: 'url',
        }),
      });

      if (res.status === 429) {
        const wait = Math.pow(2, attempt + 2) * 1000;
        console.log(`  Rate limited, waiting ${wait/1000}s...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`API ${res.status}: ${err.slice(0, 200)}`);
      }

      const data = await res.json();
      const imageUrl = data.data[0].url;

      // Download the image
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error(`Image download failed: ${imgRes.status}`);

      const buffer = Buffer.from(await imgRes.arrayBuffer());
      writeFileSync(outPath, buffer);

      return { slug, ok: true, skipped: false, size: buffer.length };
    } catch (e) {
      if (attempt === retries) {
        return { slug, ok: false, error: e.message.slice(0, 100) };
      }
      console.log(`  Retry ${attempt + 1}: ${e.message.slice(0, 80)}`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

async function main() {
  console.log(`DALL-E 3 Cover Generation | Concurrency: ${CONCURRENCY}, Limit: ${LIMIT}`);

  // Ensure covers directory exists
  const coversDir = join(BASE, 'covers');
  if (!existsSync(coversDir)) mkdirSync(coversDir, { recursive: true });

  const index = JSON.parse(readFileSync(join(BASE, 'index.json'), 'utf-8'));

  // Find articles that need covers (translated or cleaned, not skipped)
  const todo = index.articles
    .filter(a => {
      if (a.status === 'skipped') return false;
      if (a.files.cover) return false; // already has cover reference
      return true;
    })
    .slice(0, LIMIT);

  console.log(`Found ${todo.length} articles needing covers\n`);

  let done = 0;
  let errors = 0;
  let skipped = 0;
  let totalBytes = 0;

  // Process in batches
  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    const batch = todo.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;
    const totalBatches = Math.ceil(todo.length / CONCURRENCY);
    console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} images)...`);

    const results = await Promise.all(
      batch.map(article => generateCover(article))
    );

    for (const r of results) {
      if (r.ok) {
        if (r.skipped) {
          skipped++;
          process.stdout.write(`  ⊘ ${r.slug} (exists)\n`);
        } else {
          done++;
          totalBytes += r.size || 0;
          process.stdout.write(`  ✓ ${r.slug} (${Math.round((r.size||0)/1024)}KB)\n`);

          // Update index entry
          const article = index.articles.find(a => a.slug === r.slug);
          if (article) {
            article.files.cover = `covers/${r.slug}.png`;
            article.timestamps.cover_at = new Date().toISOString();
          }
        }
      } else {
        errors++;
        process.stdout.write(`  ✗ ${r.slug}: ${r.error}\n`);
      }
    }

    // Save index periodically
    if (done % 10 === 0 || i + CONCURRENCY >= todo.length) {
      index.updated_at = new Date().toISOString();
      writeFileSync(join(BASE, 'index.json'), JSON.stringify(index, null, 2));
    }

    console.log(`  Progress: ${done + skipped}/${todo.length} (${errors} errors)\n`);

    // DALL-E rate limit: be gentle
    if (!batch.every(b => existsSync(join(BASE, 'covers', `${b.slug}.png`)))) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Final save
  index.updated_at = new Date().toISOString();
  writeFileSync(join(BASE, 'index.json'), JSON.stringify(index, null, 2));

  console.log('='.repeat(50));
  console.log('COVER GENERATION COMPLETE');
  console.log('='.repeat(50));
  console.log(`Generated: ${done}`);
  console.log(`Skipped (existing): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total size: ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);

  // Estimate cost: DALL-E 3 standard 1792x1024 = $0.080 per image
  const cost = done * 0.08;
  console.log(`Estimated cost: $${cost.toFixed(2)} (${done} images × $0.08)`);
}

main().catch(e => { console.error(e); process.exit(1); });
