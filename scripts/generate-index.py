#!/usr/bin/env python3
"""Generate master index.json from all raw article JSON files."""

import json
import os
import re
from datetime import datetime
from collections import defaultdict


def load_articles(raw_dir):
    """Load all raw JSON articles from subdirectories."""
    articles = []
    for source in ['weizhiyong', 'johngai', 'baidu', 'zhihu']:
        source_dir = os.path.join(raw_dir, source)
        if not os.path.isdir(source_dir):
            continue
        for fname in sorted(os.listdir(source_dir)):
            if not fname.endswith('.json'):
                continue
            fpath = os.path.join(source_dir, fname)
            with open(fpath, 'r', encoding='utf-8') as f:
                article = json.load(f)
            article['_file'] = f'raw/{source}/{fname}'
            articles.append(article)
    return articles


def find_duplicates(articles):
    """Find duplicate articles across sources based on title similarity."""
    # Group by normalized title
    title_map = defaultdict(list)
    for i, a in enumerate(articles):
        # Normalize title for comparison
        t = a['title_zh'].strip().lower()
        t = re.sub(r'[^\u4e00-\u9fff\w]', '', t)  # keep only CJK + alphanumeric
        if t:
            title_map[t].append(i)

    duplicates = {}  # index -> duplicate_of_slug
    for title, indices in title_map.items():
        if len(indices) > 1:
            # Keep the one from highest priority source
            priority = {'weizhiyong': 0, 'zhihu': 1, 'johngai': 2, 'baidu': 3}
            sorted_idx = sorted(indices, key=lambda i: priority.get(articles[i]['source'], 99))
            primary = sorted_idx[0]
            for dup in sorted_idx[1:]:
                duplicates[dup] = articles[primary]['slug']

    return duplicates


def determine_priority(article):
    """Assign priority tier."""
    source = article['source']
    too_short = article.get('flags', {}).get('too_short', False)
    if too_short:
        return 'skip'
    if source == 'weizhiyong':
        return 'P0'
    elif source == 'zhihu':
        return 'P1'
    elif source == 'johngai':
        return 'P3'
    elif source == 'baidu':
        return 'P2'
    return 'P2'


def build_index(articles, duplicates):
    """Build the master index structure."""
    now = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')

    entries = []
    stats_source = defaultdict(int)
    stats_status = defaultdict(int)
    stats_category = defaultdict(int)
    stats_priority = defaultdict(int)

    for i, a in enumerate(articles):
        is_dup = i in duplicates
        is_short = a.get('flags', {}).get('too_short', False)

        if is_dup:
            status = 'skipped'
        elif is_short:
            status = 'skipped'
        else:
            status = 'raw'

        priority = determine_priority(a)
        if is_dup or is_short:
            priority = 'skip'

        entry = {
            'id': f"{a['source']}-{len([e for e in entries if e['source'] == a['source']]) + 1:04d}",
            'slug': a['slug'],
            'title_zh': a['title_zh'],
            'source': a['source'],
            'source_file': a.get('source_file', ''),
            'original_date': a.get('original_date'),
            'category': a.get('category', 'writing'),
            'tags': a.get('tags', []),
            'char_count': a.get('char_count', 0),
            'reading_time_min': a.get('reading_time_min', 1),
            'status': status,
            'priority': priority,
            'files': {
                'raw': a['_file'],
            },
            'timestamps': {
                'raw_at': now,
            },
            'flags': {
                'too_short': is_short,
                'duplicate_of': duplicates.get(i),
                'has_code_blocks': a.get('flags', {}).get('has_code_blocks', False),
                'has_images': a.get('flags', {}).get('has_images', False),
                'needs_date_extraction': a.get('flags', {}).get('needs_date_extraction', False),
            }
        }

        entries.append(entry)

        stats_source[a['source']] += 1
        stats_status[status] += 1
        stats_category[a.get('category', 'writing')] += 1
        stats_priority[priority] += 1

    index = {
        'version': '1.0',
        'generated_at': now,
        'updated_at': now,
        'stats': {
            'total': len(entries),
            'by_status': dict(stats_status),
            'by_source': dict(stats_source),
            'by_category': dict(stats_category),
            'by_priority': dict(stats_priority),
        },
        'articles': entries,
    }

    return index


def main():
    base = '/workspace/extra/repos/johngai-blog/content'

    print("Loading raw articles...")
    articles = load_articles(os.path.join(base, 'raw'))
    print(f"  Total loaded: {len(articles)}")

    print("Finding duplicates...")
    duplicates = find_duplicates(articles)
    print(f"  Duplicates found: {len(duplicates)}")
    for idx, dup_of in list(duplicates.items())[:5]:
        print(f"    '{articles[idx]['title_zh']}' ({articles[idx]['source']}) -> dup of {dup_of}")

    print("Building index...")
    index = build_index(articles, duplicates)

    # Write index
    index_path = os.path.join(base, 'index.json')
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    # Print summary
    print(f"\n{'='*50}")
    print(f"INDEX GENERATED: {index_path}")
    print(f"{'='*50}")
    print(f"Total articles: {index['stats']['total']}")
    print(f"\nBy source:")
    for s, n in sorted(index['stats']['by_source'].items()):
        print(f"  {s}: {n}")
    print(f"\nBy status:")
    for s, n in sorted(index['stats']['by_status'].items()):
        print(f"  {s}: {n}")
    print(f"\nBy priority:")
    for p, n in sorted(index['stats']['by_priority'].items()):
        print(f"  {p}: {n}")
    print(f"\nBy category:")
    for c, n in sorted(index['stats']['by_category'].items(), key=lambda x: -x[1]):
        print(f"  {c}: {n}")

    # P0 articles detail
    p0 = [a for a in index['articles'] if a['priority'] == 'P0']
    print(f"\n{'='*50}")
    print(f"P0 Articles (weizhiyong, {len(p0)} total):")
    print(f"{'='*50}")
    for a in sorted(p0, key=lambda x: x.get('original_date') or '0000'):
        print(f"  [{a['original_date'] or 'no-date'}] {a['title_zh'][:40]} ({a['category']}, {a['char_count']} chars)")


if __name__ == '__main__':
    main()
