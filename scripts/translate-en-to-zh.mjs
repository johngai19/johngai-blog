#!/usr/bin/env node
/**
 * Translate 2 English-only articles to Chinese using homelab LLM Gateway.
 * Splits long content into ~8K char chunks, translates each, then combines.
 *
 * Usage: node scripts/translate-en-to-zh.mjs
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lxunzzzdnokdqhipbmdf.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dW56enpkbm9rZHFoaXBibWRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI4OTQ4NCwiZXhwIjoyMDg3ODY1NDg0fQ.ykdWKOiBq6C5blwejshKjCNw6yRJGr_Y-8BJueBFd2I';
const LLM_URL = 'llm.ngaisy.com';
const LLM_KEY = 'sk-homelab-2026';
const MODEL = 'sf/deepseek-v3.2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ARTICLE_IDS = [
  '0d075d9d-5a31-4d4d-ba8c-1c4ef5bddafe', // comprehensive guide C#/Python/TS/Go
  'fa5f2fae-d01d-46e9-9078-ba56c9a57be7',  // full-stack dev with Cursor
];

function llmCall(messages, maxTokens = 8000) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.3,
    });

    const req = https.request({
      hostname: LLM_URL,
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_KEY}`,
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 180000,
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.error) reject(new Error(JSON.stringify(json.error)));
          else resolve(json.choices[0].message.content);
        } catch (e) { reject(new Error(`Parse error: ${body.substring(0,200)}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(data);
    req.end();
  });
}

// Split content at markdown heading boundaries, each chunk <= maxLen chars
function splitContent(content, maxLen = 5000) {
  const lines = content.split('\n');
  const chunks = [];
  let current = '';

  for (const line of lines) {
    // If adding this line would exceed limit and we have content, start new chunk at heading
    if (current.length + line.length + 1 > maxLen && current.length > 500) {
      if (/^#{1,3}\s/.test(line)) {
        chunks.push(current.trim());
        current = line + '\n';
        continue;
      }
    }
    current += line + '\n';
    // Force split if way too long
    if (current.length > maxLen + 1000) {
      chunks.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function translateTitle(titleEn) {
  const result = await withRetry(() => llmCall([
    { role: 'system', content: 'You are a translator. Translate the English article title to Chinese. Return ONLY the Chinese title, nothing else.' },
    { role: 'user', content: titleEn }
  ], 200));
  return result.trim();
}

async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      console.log(`  Retry ${i+1}/${retries} after error: ${e.message}`);
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 5000 * (i + 1)));
    }
  }
}

async function translateChunk(chunk, index, total) {
  console.log(`  Translating chunk ${index+1}/${total} (${chunk.length} chars)...`);
  const result = await withRetry(() => llmCall([
    {
      role: 'system',
      content: `You are an expert English-to-Chinese translator for a tech blog. Translate the following English markdown content to Chinese.
Rules:
- Keep ALL markdown formatting (headings, code blocks, lists, links, bold, etc.) intact
- Keep code snippets, variable names, and technical terms in their original form
- Translate naturally, not word-by-word
- Keep the same structure and paragraph breaks
- Return ONLY the translated markdown, nothing else`
    },
    { role: 'user', content: chunk }
  ], 12000));
  return result;
}

async function processArticle(id) {
  console.log(`\nFetching article ${id}...`);
  const { data: article, error } = await supabase
    .from('articles')
    .select('id,slug,title_en,content_en')
    .eq('id', id)
    .single();

  if (error) { console.error('Fetch error:', error); return; }
  console.log(`Article: ${article.title_en} (${article.content_en.length} chars)`);

  // Translate title
  console.log('  Translating title...');
  const titleZh = await translateTitle(article.title_en);
  console.log(`  Title ZH: ${titleZh}`);

  // Split and translate content
  const chunks = splitContent(article.content_en);
  console.log(`  Split into ${chunks.length} chunks`);

  const translatedChunks = [];
  for (let i = 0; i < chunks.length; i++) {
    const translated = await translateChunk(chunks[i], i, chunks.length);
    translatedChunks.push(translated);
    // Small delay between chunks
    if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 2000));
  }

  const contentZh = translatedChunks.join('\n\n');
  console.log(`  Total translated: ${contentZh.length} chars`);

  // Update in Supabase
  const { error: updateError } = await supabase
    .from('articles')
    .update({ title_zh: titleZh, content_zh: contentZh })
    .eq('id', id);

  if (updateError) console.error('Update error:', updateError);
  else console.log(`  Updated article ${article.slug}`);
}

async function main() {
  for (const id of ARTICLE_IDS) {
    await processArticle(id);
  }
  console.log('\nDone!');
}

main().catch(console.error);
