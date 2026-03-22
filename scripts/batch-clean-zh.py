#!/usr/bin/env python3
"""Batch clean Chinese content for P0 articles (raw JSON → cleaned Markdown)."""

import json
import os
import re
import html


def deep_clean_html_to_md(content):
    """Thorough HTML to clean Markdown conversion with Chinese text optimization."""
    if not content:
        return ''

    text = content

    # Decode HTML entities
    text = html.unescape(text)

    # Remove WordPress shortcodes
    text = re.sub(r'\[/?caption[^\]]*\]', '', text)
    text = re.sub(r'\[/?gallery[^\]]*\]', '', text)
    text = re.sub(r'\[/?embed[^\]]*\]', '', text)
    text = re.sub(r'\[/?audio[^\]]*\]', '', text)
    text = re.sub(r'\[/?video[^\]]*\]', '', text)

    # Remove WordPress-specific comment blocks
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)

    # Remove tracking/ad elements
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
    text = re.sub(r'<iframe[^>]*>.*?</iframe>', '', text, flags=re.DOTALL)

    # Headers
    for i in range(6, 0, -1):
        text = re.sub(rf'<h{i}[^>]*>(.*?)</h{i}>', r'\n' + '#' * i + r' \1\n', text, flags=re.DOTALL)

    # Bold and italic
    text = re.sub(r'<strong[^>]*>(.*?)</strong>', r'**\1**', text, flags=re.DOTALL)
    text = re.sub(r'<b[^>]*>(.*?)</b>', r'**\1**', text, flags=re.DOTALL)
    text = re.sub(r'<em[^>]*>(.*?)</em>', r'*\1*', text, flags=re.DOTALL)
    text = re.sub(r'<i[^>]*>(.*?)</i>', r'*\1*', text, flags=re.DOTALL)

    # Links - keep meaningful ones, remove self-referencing
    text = re.sub(r'<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>', r'[\2](\1)', text, flags=re.DOTALL)

    # Images
    text = re.sub(r'<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*/?>',
                  lambda m: f'![{m.group(2)}]({m.group(1)})' if m.group(2) else f'![]({m.group(1)})',
                  text)
    text = re.sub(r'<img[^>]*src="([^"]*)"[^>]*/?>',  r'![](\1)', text)

    # Code blocks with language
    text = re.sub(r'<pre[^>]*><code[^>]*class="[^"]*language-(\w+)[^"]*"[^>]*>(.*?)</code></pre>',
                  r'\n```\1\n\2\n```\n', text, flags=re.DOTALL)
    text = re.sub(r'<pre[^>]*><code[^>]*>(.*?)</code></pre>',
                  r'\n```\n\1\n```\n', text, flags=re.DOTALL)
    text = re.sub(r'<pre[^>]*>(.*?)</pre>',
                  r'\n```\n\1\n```\n', text, flags=re.DOTALL)

    # Inline code
    text = re.sub(r'<code[^>]*>(.*?)</code>', r'`\1`', text, flags=re.DOTALL)

    # Lists - ordered
    counter = [0]
    def replace_ol_li(match):
        counter[0] += 1
        return f'{counter[0]}. {match.group(1)}'
    text = re.sub(r'<ol[^>]*>', lambda m: '', text)
    text = re.sub(r'</ol>', '', text)

    # Lists - unordered
    text = re.sub(r'<li[^>]*>(.*?)</li>', r'- \1', text, flags=re.DOTALL)
    text = re.sub(r'</?[ou]l[^>]*>', '', text)

    # Blockquotes
    text = re.sub(r'<blockquote[^>]*>(.*?)</blockquote>',
                  lambda m: '\n> ' + m.group(1).strip().replace('\n', '\n> ') + '\n',
                  text, flags=re.DOTALL)

    # Horizontal rules
    text = re.sub(r'<hr[^>]*/>', '\n---\n', text)

    # Tables - basic conversion
    text = re.sub(r'<table[^>]*>(.*?)</table>',
                  lambda m: '\n' + m.group(1) + '\n', text, flags=re.DOTALL)
    text = re.sub(r'<tr[^>]*>(.*?)</tr>', r'\1\n', text, flags=re.DOTALL)
    text = re.sub(r'<t[dh][^>]*>(.*?)</t[dh]>', r'| \1 ', text, flags=re.DOTALL)

    # Paragraphs and line breaks
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'<p[^>]*>(.*?)</p>', r'\n\1\n', text, flags=re.DOTALL)

    # Remove all remaining HTML tags
    text = re.sub(r'<[^>]+>', '', text)

    # --- Chinese text specific cleanup ---

    # Fix half-width punctuation to full-width for Chinese text
    # Only replace when surrounded by CJK characters
    text = re.sub(r'(?<=[\u4e00-\u9fff]),(?=[\u4e00-\u9fff])', '，', text)
    text = re.sub(r'(?<=[\u4e00-\u9fff])\.(?=[\u4e00-\u9fff])', '。', text)
    text = re.sub(r'(?<=[\u4e00-\u9fff]);(?=[\u4e00-\u9fff])', '；', text)
    text = re.sub(r'(?<=[\u4e00-\u9fff]):(?=[\u4e00-\u9fff])', '：', text)
    text = re.sub(r'(?<=[\u4e00-\u9fff])\?(?=[\u4e00-\u9fff])', '？', text)
    text = re.sub(r'(?<=[\u4e00-\u9fff])!(?=[\u4e00-\u9fff])', '！', text)

    # Clean up excessive whitespace
    text = re.sub(r'[ \t]+\n', '\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Remove leading/trailing whitespace per line
    lines = text.split('\n')
    lines = [line.strip() for line in lines]
    text = '\n'.join(lines)

    # Final cleanup
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = text.strip()

    return text


def clean_article(raw_json_path, output_dir):
    """Clean a single article and write to cleaned/ directory."""
    with open(raw_json_path, 'r', encoding='utf-8') as f:
        article = json.load(f)

    slug = article['slug']
    content = article.get('content_zh', '')

    # If content was from HTML source, do deep clean
    if article.get('content_html'):
        cleaned = deep_clean_html_to_md(article['content_html'])
    else:
        cleaned = deep_clean_html_to_md(content)

    # Write cleaned markdown
    out_path = os.path.join(output_dir, f'{slug}.md')

    # Add frontmatter
    frontmatter = f"""---
title: {article['title_zh']}
slug: {slug}
date: {article.get('original_date', 'unknown')}
source: {article['source']}
category: {article['category']}
tags: {json.dumps(article.get('tags', []))}
reading_time: {article.get('reading_time_min', 1)}
---

"""

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(frontmatter + cleaned)

    return slug, len(cleaned)


def main():
    base = '/workspace/extra/repos/johngai-blog/content'
    index_path = os.path.join(base, 'index.json')

    with open(index_path, 'r', encoding='utf-8') as f:
        index = json.load(f)

    # Process P0 articles first
    p0_articles = [a for a in index['articles'] if a['priority'] == 'P0']
    print(f"Processing {len(p0_articles)} P0 articles...")

    cleaned_count = 0
    errors = 0
    total_chars = 0

    for article in p0_articles:
        raw_file = os.path.join(base, article['files']['raw'])
        if not os.path.exists(raw_file):
            print(f"  SKIP: {article['slug']} (raw file missing)")
            errors += 1
            continue

        try:
            slug, char_count = clean_article(raw_file, os.path.join(base, 'cleaned'))
            total_chars += char_count
            cleaned_count += 1

            # Update index entry
            article['status'] = 'cleaned'
            article['files']['cleaned'] = f'cleaned/{slug}.md'
            article['timestamps']['cleaned_at'] = '2026-03-20T11:45:00Z'

        except Exception as e:
            print(f"  ERROR: {article['slug']}: {e}")
            errors += 1

    # Also process P1 (zhihu) articles
    p1_articles = [a for a in index['articles'] if a['priority'] == 'P1']
    print(f"\nProcessing {len(p1_articles)} P1 articles...")

    for article in p1_articles:
        raw_file = os.path.join(base, article['files']['raw'])
        if not os.path.exists(raw_file):
            print(f"  SKIP: {article['slug']} (raw file missing)")
            errors += 1
            continue

        try:
            slug, char_count = clean_article(raw_file, os.path.join(base, 'cleaned'))
            total_chars += char_count
            cleaned_count += 1
            article['status'] = 'cleaned'
            article['files']['cleaned'] = f'cleaned/{slug}.md'
            article['timestamps']['cleaned_at'] = '2026-03-20T11:45:00Z'
        except Exception as e:
            print(f"  ERROR: {article['slug']}: {e}")
            errors += 1

    # Also process P3 (johngai non-duplicate) articles
    p3_articles = [a for a in index['articles'] if a['priority'] == 'P3']
    print(f"\nProcessing {len(p3_articles)} P3 articles...")

    for article in p3_articles:
        raw_file = os.path.join(base, article['files']['raw'])
        if not os.path.exists(raw_file):
            print(f"  SKIP: {article['slug']} (raw file missing)")
            errors += 1
            continue

        try:
            slug, char_count = clean_article(raw_file, os.path.join(base, 'cleaned'))
            total_chars += char_count
            cleaned_count += 1
            article['status'] = 'cleaned'
            article['files']['cleaned'] = f'cleaned/{slug}.md'
            article['timestamps']['cleaned_at'] = '2026-03-20T11:45:00Z'
        except Exception as e:
            print(f"  ERROR: {article['slug']}: {e}")
            errors += 1

    # Update stats
    status_counts = {}
    for a in index['articles']:
        s = a['status']
        status_counts[s] = status_counts.get(s, 0) + 1
    index['stats']['by_status'] = status_counts
    index['updated_at'] = '2026-03-20T11:45:00Z'

    # Write updated index
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*50}")
    print(f"CLEANING COMPLETE")
    print(f"{'='*50}")
    print(f"Cleaned: {cleaned_count} articles")
    print(f"Errors: {errors}")
    print(f"Total characters: {total_chars:,}")
    print(f"\nUpdated status distribution:")
    for s, n in sorted(status_counts.items()):
        print(f"  {s}: {n}")


if __name__ == '__main__':
    main()
