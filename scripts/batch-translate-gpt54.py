#!/usr/bin/env python3
"""
Batch translate articles using OpenAI GPT-5.4 API via urllib (no dependencies).
Uses curl for actual API calls to avoid Node.js socket issues.

Usage: python3 scripts/batch-translate-gpt54.py [--limit N] [--concurrency N]
"""

import json
import os
import sys
import time
import http.client
import ssl
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    print('Missing OPENAI_API_KEY')
    sys.exit(1)

# Parse args
args = sys.argv[1:]
LIMIT = 999
CONCURRENCY = 4
MODEL = 'gpt-5.4'
for i, a in enumerate(args):
    if a == '--limit' and i + 1 < len(args): LIMIT = int(args[i+1])
    if a == '--concurrency' and i + 1 < len(args): CONCURRENCY = int(args[i+1])
    if a == '--model' and i + 1 < len(args): MODEL = args[i+1]

BASE = Path('/workspace/extra/repos/johngai-blog/content')

SYSTEM_PROMPT = """You are an expert Chinese-to-English literary translator for a personal blog by John Wei (魏智勇), a DevOps engineer from China living in Hong Kong.

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
- The author switches between contemplative and humorous — match the tone of each piece"""


def call_openai(user_prompt, retries=3):
    """Call OpenAI API using http.client (pure Python, no curl/fetch issues)."""
    body = json.dumps({
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.7,
        "max_completion_tokens": 16000,
        "response_format": {"type": "json_object"}
    }).encode('utf-8')

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {OPENAI_API_KEY}',
        'Content-Length': str(len(body)),
    }

    for attempt in range(retries + 1):
        conn = None
        try:
            ctx = ssl.create_default_context()
            conn = http.client.HTTPSConnection('api.openai.com', timeout=240, context=ctx)
            conn.request('POST', '/v1/chat/completions', body=body, headers=headers)
            resp = conn.getresponse()
            raw = resp.read().decode('utf-8')
            status = resp.status
            conn.close()

            if status == 429:
                wait = 2 ** (attempt + 1)
                print(f"  Rate limited, waiting {wait}s...", flush=True)
                time.sleep(wait)
                continue

            if status != 200:
                raise Exception(f"API {status}: {raw[:200]}")

            data = json.loads(raw)
            content = data['choices'][0]['message']['content']
            usage = data.get('usage', {})
            parsed = json.loads(content)
            return parsed, usage

        except Exception as e:
            if conn:
                try: conn.close()
                except: pass
            if attempt == retries:
                raise
            print(f"  Retry {attempt + 1}: {str(e)[:200]}", flush=True)
            time.sleep(3 * (attempt + 1))

    return None, None


def translate_article(article, index_data):
    """Translate a single article."""
    cleaned_path = BASE / article['files']['cleaned']
    raw = cleaned_path.read_text('utf-8')

    # Extract content after frontmatter
    parts = raw.split('---')
    content = '---'.join(parts[2:]).strip() if len(parts) >= 3 else raw
    title = article['title_zh']

    # Truncate very long articles to avoid API timeout (max ~15K chars)
    MAX_CONTENT = 15000
    truncated = False
    if len(content) > MAX_CONTENT:
        content = content[:MAX_CONTENT] + '\n\n[... article continues ...]'
        truncated = True

    user_prompt = f"""Translate this Chinese blog article to English.

Title: {title}
Category: {article.get('category', 'writing')}
Original date: {article.get('original_date', 'unknown')}
{'Note: This article was truncated for translation. Translate what is provided.' if truncated else ''}

---
{content}
---

Remember: translate naturally following all 10 rules. For very short pieces (poems, reflections), keep them short. Return JSON only."""

    try:
        result, usage = call_openai(user_prompt)
        if result is None:
            return {'slug': article['slug'], 'ok': False, 'error': 'No result'}

        # Write translated file
        slug = article['slug']
        out_path = BASE / 'translated' / f'{slug}-en.md'
        title_en = (result.get('title_en') or '').replace('"', '\\"')
        excerpt_zh = (result.get('excerpt_zh') or '').replace('"', '\\"')
        excerpt_en = (result.get('excerpt_en') or '').replace('"', '\\"')
        content_en = result.get('content_en') or ''

        out_content = f'''---
title_en: "{title_en}"
excerpt_zh: "{excerpt_zh}"
excerpt_en: "{excerpt_en}"
translated_at: "2026-03-20"
model: "{MODEL}"
---

{content_en}'''

        out_path.write_text(out_content, encoding='utf-8')

        # Update index entry
        article['status'] = 'translated'
        article['files']['translated'] = f'translated/{slug}-en.md'
        article['timestamps']['translated_at'] = time.strftime('%Y-%m-%dT%H:%M:%SZ')

        tokens = usage.get('total_tokens', 0)
        return {
            'slug': slug,
            'title': title[:30],
            'title_en': (result.get('title_en') or '')[:40],
            'tokens': tokens,
            'ok': True
        }

    except Exception as e:
        return {
            'slug': article['slug'],
            'title': title[:30],
            'error': str(e)[:100],
            'ok': False
        }


def main():
    print(f"Model: {MODEL}, Concurrency: {CONCURRENCY}, Limit: {LIMIT}")

    index = json.loads((BASE / 'index.json').read_text('utf-8'))

    # Find articles to translate
    todo = [a for a in index['articles'] if a['status'] == 'cleaned' and a.get('files', {}).get('cleaned')][:LIMIT]
    print(f"Found {len(todo)} articles to translate\n")

    total_tokens = 0
    done = 0
    errors = 0

    # Process with thread pool
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        futures = {}
        batch_size = CONCURRENCY

        for i in range(0, len(todo), batch_size):
            batch = todo[i:i+batch_size]
            batch_num = i // batch_size + 1
            total_batches = (len(todo) + batch_size - 1) // batch_size
            print(f"Batch {batch_num}/{total_batches} ({len(batch)} articles)...")

            future_to_art = {
                executor.submit(translate_article, art, index): art
                for art in batch
            }

            for future in as_completed(future_to_art):
                r = future.result()
                if r['ok']:
                    done += 1
                    total_tokens += r.get('tokens', 0)
                    print(f"  ✓ {r['title']} → {r['title_en']} ({r['tokens']} tokens)")
                else:
                    errors += 1
                    print(f"  ✗ {r.get('title', r['slug'])}: {r.get('error', 'unknown')}")

            # Save index after each batch
            status_counts = {}
            for a in index['articles']:
                s = a['status']
                status_counts[s] = status_counts.get(s, 0) + 1
            index['stats']['by_status'] = status_counts
            index['updated_at'] = time.strftime('%Y-%m-%dT%H:%M:%SZ')
            (BASE / 'index.json').write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding='utf-8')
            print(f"  Saved. Progress: {done}/{len(todo)}\n")

    # Final summary
    print('=' * 50)
    print('TRANSLATION COMPLETE')
    print('=' * 50)
    print(f"Translated: {done}")
    print(f"Errors: {errors}")
    print(f"Total tokens: {total_tokens:,}")

    # Estimate cost (gpt-5.4 pricing: ~$2.5/1M input, ~$10/1M output)
    input_cost = (total_tokens * 0.6) * 2.5 / 1_000_000
    output_cost = (total_tokens * 0.4) * 10 / 1_000_000
    total_cost = input_cost + output_cost
    print(f"Estimated cost: ${total_cost:.2f} ({MODEL})")

    final_status = {}
    for a in index['articles']:
        s = a['status']
        final_status[s] = final_status.get(s, 0) + 1
    print('\nFinal status:')
    for s, n in sorted(final_status.items()):
        print(f"  {s}: {n}")


if __name__ == '__main__':
    main()
