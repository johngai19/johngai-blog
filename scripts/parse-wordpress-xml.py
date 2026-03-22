#!/usr/bin/env python3
"""Parse WordPress WXR XML exports into individual raw JSON files."""

import xml.etree.ElementTree as ET
import json
import os
import re
import html
import sys
from datetime import datetime
from pathlib import Path

# WordPress XML namespaces
NS = {
    'wp': 'http://wordpress.org/export/1.2/',
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'excerpt': 'http://wordpress.org/export/1.2/excerpt/',
    'dc': 'http://purl.org/dc/elements/1.1/',
}

# Category mapping from WordPress categories to 6-category system
CATEGORY_MAP = {
    # weizhiyong.com categories
    'devops': 'engineering',
    'coding': 'engineering',
    'os': 'engineering',
    'ai': 'engineering',
    'autotech': 'engineering',
    'materials': 'industry',
    'life': 'life',
    'reading': 'books',
    'book': 'books',
    'books': 'books',
    'travel': 'life',
    'family': 'life',
    'thoughts': 'writing',
    'essay': 'writing',
    'writing': 'writing',
    'startup': 'startup',
    'business': 'startup',
    'career': 'life',
    'tech': 'engineering',
    'technology': 'engineering',
    'programming': 'engineering',
    'linux': 'engineering',
    'docker': 'engineering',
    'kubernetes': 'engineering',
    'cloud': 'engineering',
    'security': 'engineering',
    'python': 'engineering',
    'javascript': 'engineering',
    'uncategorized': 'writing',  # default
}


def slugify(text):
    """Generate a URL-safe slug from text."""
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Convert to lowercase
    text = text.lower().strip()
    # Replace spaces and special chars with hyphens
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    text = text.strip('-')
    return text[:80] if text else 'untitled'


def html_to_markdown(html_content):
    """Basic HTML to Markdown conversion."""
    if not html_content:
        return ''

    text = html_content

    # Decode HTML entities
    text = html.unescape(text)

    # Headers
    for i in range(6, 0, -1):
        text = re.sub(rf'<h{i}[^>]*>(.*?)</h{i}>', r'\n' + '#' * i + r' \1\n', text, flags=re.DOTALL)

    # Bold and italic
    text = re.sub(r'<strong[^>]*>(.*?)</strong>', r'**\1**', text, flags=re.DOTALL)
    text = re.sub(r'<b[^>]*>(.*?)</b>', r'**\1**', text, flags=re.DOTALL)
    text = re.sub(r'<em[^>]*>(.*?)</em>', r'*\1*', text, flags=re.DOTALL)
    text = re.sub(r'<i[^>]*>(.*?)</i>', r'*\1*', text, flags=re.DOTALL)

    # Links
    text = re.sub(r'<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>', r'[\2](\1)', text, flags=re.DOTALL)

    # Images
    text = re.sub(r'<img[^>]*src="([^"]*)"[^>]*/>', r'![](\1)', text)
    text = re.sub(r'<img[^>]*src="([^"]*)"[^>]*>', r'![](\1)', text)

    # Code blocks
    text = re.sub(r'<pre[^>]*><code[^>]*class="language-(\w+)"[^>]*>(.*?)</code></pre>',
                  r'\n```\1\n\2\n```\n', text, flags=re.DOTALL)
    text = re.sub(r'<pre[^>]*><code[^>]*>(.*?)</code></pre>',
                  r'\n```\n\1\n```\n', text, flags=re.DOTALL)
    text = re.sub(r'<pre[^>]*>(.*?)</pre>', r'\n```\n\1\n```\n', text, flags=re.DOTALL)

    # Inline code
    text = re.sub(r'<code[^>]*>(.*?)</code>', r'`\1`', text, flags=re.DOTALL)

    # Lists
    text = re.sub(r'<li[^>]*>(.*?)</li>', r'- \1', text, flags=re.DOTALL)
    text = re.sub(r'</?[ou]l[^>]*>', '', text)

    # Blockquotes
    text = re.sub(r'<blockquote[^>]*>(.*?)</blockquote>',
                  lambda m: '\n> ' + m.group(1).strip().replace('\n', '\n> ') + '\n',
                  text, flags=re.DOTALL)

    # Paragraphs and line breaks
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'<p[^>]*>(.*?)</p>', r'\n\1\n', text, flags=re.DOTALL)

    # Remove remaining HTML tags
    text = re.sub(r'<[^>]+>', '', text)

    # Clean up whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = text.strip()

    return text


def map_category(wp_categories):
    """Map WordPress categories to the 6-category system."""
    for cat in wp_categories:
        cat_lower = cat.lower().strip()
        if cat_lower in CATEGORY_MAP:
            return CATEGORY_MAP[cat_lower]
    return 'writing'  # default


def extract_tags(wp_tags, wp_categories):
    """Extract and normalize tags."""
    tags = []
    for t in wp_tags:
        tag = t.lower().strip()
        tag = re.sub(r'[^\w-]', '-', tag)
        tag = re.sub(r'-+', '-', tag).strip('-')
        if tag and tag not in tags:
            tags.append(tag)
    # Add category keywords as tags too
    for c in wp_categories:
        c_lower = c.lower().strip()
        if c_lower not in ['uncategorized'] and c_lower not in tags:
            tags.append(c_lower)
    return tags[:8]  # max 8 tags


def parse_xml(xml_path, source_name, output_dir):
    """Parse a WordPress XML export and output raw JSON files."""
    print(f"\n=== Parsing {xml_path} (source: {source_name}) ===")

    tree = ET.parse(xml_path)
    root = tree.getroot()
    channel = root.find('channel')

    articles = []
    skipped = 0

    for item in channel.findall('item'):
        # Filter: only published posts
        post_type = item.find('wp:post_type', NS)
        post_status = item.find('wp:status', NS)

        if post_type is None or post_type.text != 'post':
            skipped += 1
            continue
        if post_status is None or post_status.text != 'publish':
            skipped += 1
            continue

        # Extract fields
        title = item.find('title').text or 'Untitled'
        content_encoded = item.find('content:encoded', NS)
        content_html = content_encoded.text if content_encoded is not None else ''

        post_date = item.find('wp:post_date', NS)
        date_str = post_date.text if post_date is not None else None

        post_name = item.find('wp:post_name', NS)
        slug = post_name.text if post_name is not None and post_name.text else slugify(title)

        # Categories and tags
        wp_categories = []
        wp_tags = []
        for cat_elem in item.findall('category'):
            domain = cat_elem.get('domain', '')
            nicename = cat_elem.get('nicename', '')
            if domain == 'category':
                wp_categories.append(nicename or cat_elem.text or '')
            elif domain == 'post_tag':
                wp_tags.append(nicename or cat_elem.text or '')

        # Convert content
        content_md = html_to_markdown(content_html)

        # Skip very short articles
        too_short = len(content_md) < 200

        # Calculate reading time (Chinese: 500 chars/min)
        char_count = len(re.sub(r'\s', '', content_md))
        reading_time = max(1, round(char_count / 500))

        # Build article record
        article = {
            'slug': slug,
            'title_zh': title,
            'source': source_name,
            'original_date': date_str,
            'category': map_category(wp_categories),
            'wp_categories': wp_categories,
            'tags': extract_tags(wp_tags, wp_categories),
            'content_zh': content_md,
            'content_html': content_html,  # keep original for reference
            'char_count': char_count,
            'reading_time_min': reading_time,
            'flags': {
                'too_short': too_short,
                'has_code_blocks': '```' in content_md,
                'has_images': '![](' in content_md,
            }
        }

        # Write individual JSON file
        out_path = os.path.join(output_dir, f'{slug}.json')
        # Handle duplicate slugs within same source
        counter = 1
        while os.path.exists(out_path):
            out_path = os.path.join(output_dir, f'{slug}-{counter}.json')
            article['slug'] = f'{slug}-{counter}'
            counter += 1

        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(article, f, ensure_ascii=False, indent=2)

        articles.append(article)

    print(f"  Parsed: {len(articles)} articles, Skipped: {skipped} non-post items")
    print(f"  Too short (<200 chars): {sum(1 for a in articles if a['flags']['too_short'])}")
    print(f"  With code: {sum(1 for a in articles if a['flags']['has_code_blocks'])}")
    print(f"  With images: {sum(1 for a in articles if a['flags']['has_images'])}")

    return articles


def main():
    base = '/workspace/extra/repos/johngai-blog/content'
    backup = '/workspace/group/blog_backup'

    # Parse weizhiyong.com
    wzy_articles = parse_xml(
        f'{backup}/WordPress.2026-03-17.xml',
        'weizhiyong',
        f'{base}/raw/weizhiyong'
    )

    # Parse johngai.com (techforge)
    jg_articles = parse_xml(
        f'{backup}/johngaistechforge.WordPress.2026-03-17.xml',
        'johngai',
        f'{base}/raw/johngai'
    )

    # Print summary
    print(f"\n=== SUMMARY ===")
    print(f"weizhiyong.com: {len(wzy_articles)} articles")
    print(f"johngai.com:    {len(jg_articles)} articles")
    print(f"Total:          {len(wzy_articles) + len(jg_articles)} articles")

    # Category distribution
    all_articles = wzy_articles + jg_articles
    cats = {}
    for a in all_articles:
        c = a['category']
        cats[c] = cats.get(c, 0) + 1
    print(f"\nCategory distribution:")
    for c, n in sorted(cats.items(), key=lambda x: -x[1]):
        print(f"  {c}: {n}")


if __name__ == '__main__':
    main()
