#!/usr/bin/env node
/**
 * Parse WordPress WXR XML export and extract published posts.
 * No external dependencies — uses regex parsing on well-structured WXR.
 *
 * Usage: node scripts/parse-wordpress-xml.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const XML_PATH = '/Users/weizy0219/Documents/repos/nanoclaw/groups/telegram_main/blog_backup/WordPress.2026-03-17.xml';
const OUT_PATH = '/Users/weizy0219/repos/johngai-blog/content/weizhiyong-articles.json';

// ── Category mapping ────────────────────────────────────────────────
const CATEGORY_MAP = {
  '开发运维': 'engineering',
  '编程环境': 'engineering',
  'JavaScript': 'engineering',
  'C_CPP_CSharp': 'engineering',
  '其他编程语言': 'engineering',
  '操作系统': 'engineering',
  'LabVIEW': 'engineering',
  '数据库': 'engineering',
  '办公软件': 'engineering',
  '应用软件': 'engineering',
  '工业互联网': 'industry',
  '工业自动化': 'industry',
  '能源技术': 'industry',
  '试验检测': 'industry',
  '工业机器人': 'industry',
  '文学艺术': 'books',
  '影视音乐': 'books',
  '浮生掠影': 'life',
  '经营管理': 'startup',
  '未分类': 'engineering',   // fallback
  '他山之石': 'engineering',  // quotes/references — tech-oriented
};

// ── Helpers ─────────────────────────────────────────────────────────

/** Extract text from CDATA or plain tag content */
function cdata(str) {
  if (!str) return '';
  const m = str.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return m ? m[1] : str.replace(/<[^>]+>/g, '').trim();
}

/** Get first match of a tag within a block */
function tagContent(block, tag) {
  // Handle namespaced tags like wp:post_type, content:encoded
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)</${escaped}>`, 'm');
  const m = block.match(re);
  return m ? m[1] : '';
}

/** Convert HTML content to simplified Markdown */
function htmlToMarkdown(html) {
  if (!html) return '';

  let md = html;

  // Remove WordPress block comments
  md = md.replace(/<!--[\s\S]*?-->/g, '');

  // Convert headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, c) => `# ${stripTags(c).trim()}\n\n`);
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, c) => `## ${stripTags(c).trim()}\n\n`);
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, c) => `### ${stripTags(c).trim()}\n\n`);
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, c) => `#### ${stripTags(c).trim()}\n\n`);

  // Convert images — keep as markdown image
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, (_, src, alt) => `![${alt}](${src})\n\n`);
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, (_, src) => `![](${src})\n\n`);

  // Convert links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => `[${stripTags(text).trim()}](${href})`);

  // Convert lists
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner) => {
    return inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, li) => `- ${stripTags(li).trim()}\n`) + '\n';
  });
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner) => {
    let i = 0;
    return inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, li) => `${++i}. ${stripTags(li).trim()}\n`) + '\n';
  });

  // Convert blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, c) => {
    return stripTags(c).trim().split('\n').map(l => `> ${l}`).join('\n') + '\n\n';
  });

  // Convert code blocks
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, c) => `\`\`\`\n${decodeEntities(c).trim()}\n\`\`\`\n\n`);
  md = md.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, c) => `\`\`\`\n${decodeEntities(stripTags(c)).trim()}\n\`\`\`\n\n`);
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, c) => `\`${decodeEntities(c).trim()}\``);

  // Convert bold/italic/strong/em
  md = md.replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, (_, __, c) => `**${c.trim()}**`);
  md = md.replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, (_, __, c) => `*${c.trim()}*`);

  // Convert <br> to newline
  md = md.replace(/<br\s*\/?>/gi, '\n');

  // Convert paragraphs
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, c) => `${c.trim()}\n\n`);

  // Remove figure/figcaption wrappers
  md = md.replace(/<\/?figure[^>]*>/gi, '');
  md = md.replace(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/gi, '');

  // Remove remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  md = decodeEntities(md);

  // Clean up whitespace: collapse 3+ newlines to 2
  md = md.replace(/\n{3,}/g, '\n\n').trim();

  return md;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '');
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/** Generate URL-friendly slug from title */
function generateSlug(title) {
  // If title is mostly ASCII/English, just slugify directly
  const ascii = title.replace(/[^\x00-\x7F]/g, '');
  if (ascii.length > title.length * 0.5) {
    return ascii
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80);
  }

  // For Chinese titles: use pinyin-like transliteration via simple mapping
  // Since we can't import pinyin lib, use the wp:post_name (URL-encoded slug) if available,
  // or create a date-based slug
  return '';
}

// ── Main ────────────────────────────────────────────────────────────

const xml = readFileSync(XML_PATH, 'utf-8');

// Split into items
const itemBlocks = [];
let idx = 0;
while (true) {
  const start = xml.indexOf('<item>', idx);
  if (start === -1) break;
  // Find matching </item> — items don't nest in WXR
  const end = xml.indexOf('</item>', start);
  if (end === -1) break;
  itemBlocks.push(xml.substring(start, end + 7));
  idx = end + 7;
}

console.log(`Found ${itemBlocks.length} total <item> elements`);

const articles = [];
let skippedNotPost = 0;
let skippedNotPublished = 0;

for (const block of itemBlocks) {
  const postType = cdata(tagContent(block, 'wp:post_type'));
  if (postType !== 'post') {
    skippedNotPost++;
    continue;
  }

  const status = cdata(tagContent(block, 'wp:status'));
  if (status !== 'publish') {
    skippedNotPublished++;
    continue;
  }

  const title = cdata(tagContent(block, 'title'));
  const postDate = cdata(tagContent(block, 'wp:post_date'));
  const rawContent = cdata(tagContent(block, 'content:encoded'));
  const link = tagContent(block, 'link').trim();

  // Extract categories
  const categories = [];
  const catRe = /<category domain="category"[^>]*><!\[CDATA\[(.*?)\]\]><\/category>/g;
  let catMatch;
  while ((catMatch = catRe.exec(block)) !== null) {
    categories.push(catMatch[1]);
  }

  // Extract tags
  const tags = [];
  const tagRe = /<category domain="post_tag"[^>]*><!\[CDATA\[(.*?)\]\]><\/category>/g;
  let tagMatch;
  while ((tagMatch = tagRe.exec(block)) !== null) {
    tags.push(tagMatch[1]);
  }

  // Extract wp:post_name for slug
  const wpPostName = cdata(tagContent(block, 'wp:post_name'));

  // Generate slug
  let slug = generateSlug(title);
  if (!slug && wpPostName) {
    // Decode percent-encoded Chinese slug to something usable
    try {
      const decoded = decodeURIComponent(wpPostName);
      // If decoded is Chinese, create slug from date + short hash
      if (/[\u4e00-\u9fff]/.test(decoded)) {
        const dateSlug = postDate.substring(0, 10).replace(/-/g, '');
        // Use first few chars of title transliterated or a simple hash
        slug = `${dateSlug}-${wpPostName.replace(/%/g, '').substring(0, 16).toLowerCase()}`;
      } else {
        slug = decoded.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
    } catch {
      slug = wpPostName.replace(/%/g, '').substring(0, 40).toLowerCase();
    }
  }
  if (!slug) {
    slug = `post-${postDate.substring(0, 10).replace(/-/g, '')}`;
  }

  // Map categories to new system
  const mappedCategories = [...new Set(
    categories.map(c => CATEGORY_MAP[c] || 'engineering')
  )];

  // Pick primary category with priority: life > startup > industry > books > engineering
  const PRIORITY = ['life', 'startup', 'industry', 'books', 'engineering'];
  const category = PRIORITY.find(p => mappedCategories.includes(p)) || 'engineering';

  // Convert HTML to markdown
  const content = htmlToMarkdown(rawContent);

  articles.push({
    title,
    slug,
    date: postDate,
    sourceUrl: link,
    category,
    originalCategories: categories,
    tags,
    content,
  });
}

// Sort by date
articles.sort((a, b) => a.date.localeCompare(b.date));

// Write output
mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(articles, null, 2), 'utf-8');

// ── Stats ───────────────────────────────────────────────────────────
console.log('\n=== WordPress XML Parse Stats ===');
console.log(`Total items in XML:       ${itemBlocks.length}`);
console.log(`Skipped (not post):       ${skippedNotPost}`);
console.log(`Skipped (not published):  ${skippedNotPublished}`);
console.log(`Published posts parsed:   ${articles.length}`);
console.log(`Output: ${OUT_PATH}`);

// Count by category
const byCat = {};
for (const a of articles) {
  byCat[a.category] = (byCat[a.category] || 0) + 1;
}
console.log('\nBy category:');
for (const [cat, count] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${count}`);
}

// Articles with missing/empty content
const empty = articles.filter(a => !a.content || a.content.length < 10);
console.log(`\nArticles with missing/empty content: ${empty.length}`);
if (empty.length > 0) {
  for (const a of empty) {
    console.log(`  - "${a.title}" (${a.date})`);
  }
}

// Show original category distribution
const byOrigCat = {};
for (const a of articles) {
  for (const c of a.originalCategories) {
    byOrigCat[c] = (byOrigCat[c] || 0) + 1;
  }
}
console.log('\nOriginal category distribution:');
for (const [cat, count] of Object.entries(byOrigCat).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${count}`);
}
