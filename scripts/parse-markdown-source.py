#!/usr/bin/env python3
"""Parse Baidu Space and Zhihu markdown files into raw JSON."""

import json
import os
import re
from datetime import datetime
from pathlib import Path


def slugify(text):
    """Generate URL-safe slug. For Chinese text, use pinyin-like hash."""
    text = re.sub(r'<[^>]+>', '', text)
    text = text.lower().strip()
    # For mostly Chinese text, create a short hash-based slug
    if re.search(r'[\u4e00-\u9fff]', text):
        # Use first few chars + hash
        clean = re.sub(r'[^\u4e00-\u9fff\w]', '', text)[:20]
        import hashlib
        h = hashlib.md5(text.encode()).hexdigest()[:8]
        return f"{clean}-{h}" if clean else h
    # For English text
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text[:80].strip('-') or 'untitled'


def parse_frontmatter(content):
    """Extract YAML-like frontmatter and body from markdown (no yaml dep)."""
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            meta = {}
            for line in parts[1].strip().split('\n'):
                line = line.strip()
                if ':' in line:
                    key, _, val = line.partition(':')
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    if val:
                        meta[key] = val
            body = parts[2].strip()
            return meta, body
    return {}, content


def guess_category(title, content):
    """Guess category from title and content keywords."""
    text = (title + ' ' + content[:500]).lower()

    tech_keywords = ['代码', '编程', 'python', 'java', 'linux', 'docker', 'kubernetes',
                     'devops', 'api', 'git', '数据库', '服务器', '架构', 'cloud', 'aws',
                     '运维', '部署', '算法', '函数', '脚本', 'shell', 'nginx', '技术']
    life_keywords = ['生活', '旅行', '家庭', '孩子', '旅游', '假期', '记录', '日记',
                     '搬家', '结婚', '纪念', '回忆', '感悟', '成长']
    book_keywords = ['读书', '书评', '推荐', '阅读', '看完', '读完', '作者', '这本书']
    startup_keywords = ['创业', '商业', '产品', '用户', '市场', '融资', '公司']
    industry_keywords = ['行业', '趋势', '分析', '报告', '市场', 'ai', '人工智能',
                         '区块链', '元宇宙', '新能源']

    scores = {
        'engineering': sum(1 for k in tech_keywords if k in text),
        'life': sum(1 for k in life_keywords if k in text),
        'books': sum(1 for k in book_keywords if k in text),
        'startup': sum(1 for k in startup_keywords if k in text),
        'industry': sum(1 for k in industry_keywords if k in text),
        'writing': 1,  # default baseline
    }

    return max(scores, key=scores.get)


def extract_tags(title, content, source):
    """Extract tags from content."""
    tags = [source]
    text = (title + ' ' + content[:1000]).lower()

    tag_patterns = {
        'python': r'python',
        'javascript': r'javascript|js|node',
        'docker': r'docker',
        'linux': r'linux',
        'devops': r'devops|运维',
        'ai': r'ai|人工智能|机器学习|深度学习',
        'reading': r'读书|书评|阅读',
        'travel': r'旅行|旅游|游记',
        'life': r'生活|日记|感悟',
    }

    for tag, pattern in tag_patterns.items():
        if re.search(pattern, text) and tag not in tags:
            tags.append(tag)

    return tags[:8]


def parse_markdown_dir(source_dir, source_name, output_dir):
    """Parse all markdown files in a directory."""
    print(f"\n=== Parsing {source_dir} (source: {source_name}) ===")

    articles = []
    skipped = 0
    errors = 0

    for fname in sorted(os.listdir(source_dir)):
        if not fname.endswith('.md'):
            skipped += 1
            continue

        fpath = os.path.join(source_dir, fname)
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                raw = f.read()
        except Exception as e:
            print(f"  Error reading {fname}: {e}")
            errors += 1
            continue

        meta, body = parse_frontmatter(raw)

        title = meta.get('title', fname.replace('.md', ''))
        date_str = meta.get('date', meta.get('published', None))
        source_url = meta.get('url', meta.get('source_url', ''))

        # Normalize date
        if date_str:
            if isinstance(date_str, datetime):
                date_str = date_str.strftime('%Y-%m-%d')
            else:
                date_str = str(date_str)[:10]

        slug = slugify(title)

        # Content stats
        char_count = len(re.sub(r'\s', '', body))
        too_short = char_count < 200
        reading_time = max(1, round(char_count / 500))

        category = guess_category(title, body)
        tags = extract_tags(title, body, source_name)

        article = {
            'slug': slug,
            'title_zh': title,
            'source': source_name,
            'source_file': fname,
            'source_url': source_url,
            'original_date': date_str,
            'category': category,
            'tags': tags,
            'content_zh': body,
            'char_count': char_count,
            'reading_time_min': reading_time,
            'flags': {
                'too_short': too_short,
                'has_code_blocks': '```' in body,
                'has_images': '![](' in body or '![' in body,
                'needs_date_extraction': date_str is None,
            }
        }

        # Write JSON
        out_path = os.path.join(output_dir, f'{slug}.json')
        counter = 1
        while os.path.exists(out_path):
            out_path = os.path.join(output_dir, f'{slug}-{counter}.json')
            article['slug'] = f'{slug}-{counter}'
            counter += 1

        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(article, f, ensure_ascii=False, indent=2)

        articles.append(article)

    print(f"  Parsed: {len(articles)} articles, Skipped: {skipped} non-md, Errors: {errors}")
    print(f"  Too short (<200 chars): {sum(1 for a in articles if a['flags']['too_short'])}")
    print(f"  Missing date: {sum(1 for a in articles if a['flags'].get('needs_date_extraction'))}")

    return articles


def main():
    base = '/workspace/extra/repos/johngai-blog/content'
    backup = '/workspace/group/blog_backup'

    results = {}

    # Parse Baidu Space
    baidu_dir = f'{backup}/baidu'
    if os.path.isdir(baidu_dir):
        results['baidu'] = parse_markdown_dir(baidu_dir, 'baidu', f'{base}/raw/baidu')
    else:
        print(f"Baidu directory not found: {baidu_dir}")

    # Parse Zhihu
    zhihu_dir = f'{backup}/zhihu'
    if os.path.isdir(zhihu_dir):
        results['zhihu'] = parse_markdown_dir(zhihu_dir, 'zhihu', f'{base}/raw/zhihu')
    else:
        print(f"Zhihu directory not found: {zhihu_dir}")

    # Summary
    print(f"\n=== SUMMARY ===")
    total = 0
    for source, articles in results.items():
        print(f"{source}: {len(articles)} articles")
        total += len(articles)
    print(f"Total: {total}")


if __name__ == '__main__':
    main()
