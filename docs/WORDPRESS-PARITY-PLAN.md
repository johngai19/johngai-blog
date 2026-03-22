# WordPress Feature Parity Plan

*Created: 2026-03-21*

---

## Overview

This document defines a phased plan to close feature gaps between johngai.com (Next.js 16 + Supabase + Vercel) and a typical WordPress blog. Each item is scoped to the existing stack and project conventions described in CLAUDE.md.

**Current state:** 58 articles migrated from WordPress.com, admin dashboard with article list + bulk status toggle, email subscriber collection (no sending), Stripe subscriptions, GitHub OAuth login, bilingual (zh/en) Markdown rendering.

---

## Phase 1 — Critical: Admin CMS

> Goal: Let the admin create, edit, and manage articles entirely in the browser, replacing script-based workflows.

### 1.1 WYSIWYG Article Editor

**What it does:** A rich Markdown editor in the admin panel for creating and editing articles with live preview, supporting bilingual content (zh/en tabs), cover image upload, metadata fields (category, tags, slug, published_at), and draft/publish workflow.

**Implementation approach:**
- Use **Milkdown** (headless, plugin-based Markdown editor built on ProseMirror) or **Novel** (Notion-style WYSIWYG, built on Tiptap). Novel is recommended for its polished UI and lower integration effort with Next.js.
- Add `novel` (~30 KB) as a dependency. It outputs Markdown natively.
- Bilingual editing via a tab switcher that toggles between `content_zh` / `content_en` fields.
- Save via a new `PUT /api/admin/articles/[id]` route using Supabase service role key.
- Auto-generate slug from `title_en` using `slugify`.
- Auto-calculate `reading_time_min` on save (word count / 200 for zh, / 250 for en).

**Estimated complexity:** L

**Files to create or modify:**
- `src/app/admin/articles/[id]/edit/page.tsx` — new editor page
- `src/app/admin/articles/new/page.tsx` — new article creation page
- `src/app/api/admin/articles/route.ts` — POST (create)
- `src/app/api/admin/articles/[id]/route.ts` — PUT (update), DELETE
- `src/components/admin/ArticleEditor.tsx` — reusable editor component
- `src/components/admin/BilingualTabs.tsx` — zh/en tab switcher
- `src/lib/admin.ts` — admin-only data access (service role)
- `package.json` — add `novel` or `milkdown` dependency

### 1.2 Media Library UI

**What it does:** A visual interface for uploading, browsing, and selecting cover images, replacing manual file placement in `public/covers/`.

**Implementation approach:**
- Use **Supabase Storage** as the backend (bucket: `media`). This aligns with the planned Cloudflare R2 migration later since Supabase Storage is S3-compatible.
- Build a grid-based media browser component with drag-and-drop upload (use native `<input type="file">` + `DataTransfer` API, no extra library needed).
- Image optimization via Next.js `<Image>` component with Supabase Storage URLs.
- API route for upload: `POST /api/admin/media` (multipart form data, resize with `sharp` on the server).
- Integrate as a picker modal in the article editor for selecting cover images.

**Estimated complexity:** M

**Files to create or modify:**
- `src/app/admin/media/page.tsx` — media library page
- `src/app/api/admin/media/route.ts` — POST (upload), GET (list), DELETE
- `src/components/admin/MediaLibrary.tsx` — grid browser with upload zone
- `src/components/admin/MediaPicker.tsx` — modal picker for use in editor
- `package.json` — add `sharp` (if not already present via Next.js)

### 1.3 Bulk Article Import UI

**What it does:** Upload a ZIP or folder of Markdown files to batch-create articles, supporting the existing WordPress-export format.

**Implementation approach:**
- Accept a `.zip` file upload containing `.md` files with YAML frontmatter.
- Parse frontmatter on the server using `gray-matter` to extract title, date, category, tags.
- Show a preview table before committing the import.
- Insert articles in batch via Supabase `insert()` with `onConflict: 'slug'` to skip duplicates.
- Reuse the existing article schema and validation.

**Estimated complexity:** M

**Files to create or modify:**
- `src/app/admin/import/page.tsx` — import wizard UI
- `src/app/api/admin/import/route.ts` — POST (process ZIP)
- `src/components/admin/ImportPreview.tsx` — preview table before commit
- `package.json` — add `gray-matter`, `jszip`

---

## Phase 2 — SEO & Discovery

> Goal: Make the site fully discoverable by search engines and readers.

### 2.1 sitemap.xml

**What it does:** Auto-generates an XML sitemap listing all published articles and static pages for search engine crawlers.

**Implementation approach:**
- Use Next.js App Router's built-in `sitemap.ts` convention (returns `MetadataRoute.Sitemap`).
- Query all published articles from Supabase and map to `{ url, lastModified, changeFrequency, priority }`.
- Include static pages: `/`, `/articles`, `/pricing`, `/subscribe`.

**Estimated complexity:** S

**Files to create or modify:**
- `src/app/sitemap.ts` — new file (Next.js convention)

### 2.2 robots.txt

**What it does:** Tells search engines which paths to crawl and where to find the sitemap.

**Implementation approach:**
- Use Next.js App Router's built-in `robots.ts` convention.
- Allow all crawlers on public pages, disallow `/admin`, `/dashboard`, `/api`.

**Estimated complexity:** S

**Files to create or modify:**
- `src/app/robots.ts` — new file (Next.js convention)

### 2.3 RSS Feed

**What it does:** Provides an RSS 2.0 / Atom feed at `/feed.xml` so readers can subscribe in feed readers.

**Implementation approach:**
- Create a Route Handler at `src/app/feed.xml/route.ts` that returns `Content-Type: application/xml`.
- Query the 50 most recent published articles from Supabase.
- Manually construct the XML string (no library needed for basic RSS 2.0; alternatively use `feed` npm package for Atom + RSS + JSON Feed support).
- Add `<link rel="alternate" type="application/rss+xml">` to root layout `<head>`.

**Estimated complexity:** S

**Files to create or modify:**
- `src/app/feed.xml/route.ts` — new RSS route
- `src/app/layout.tsx` — add RSS `<link>` to `<head>`
- `package.json` — optionally add `feed` package

### 2.4 Structured Data (JSON-LD)

**What it does:** Adds schema.org structured data to article pages for rich search results (article title, author, date, image).

**Implementation approach:**
- Add a `<script type="application/ld+json">` block to the article detail page.
- Use `Article` and `BlogPosting` schema types.
- Use `WebSite` schema on the homepage with `SearchAction`.

**Estimated complexity:** S

**Files to create or modify:**
- `src/app/articles/[slug]/page.tsx` — add JSON-LD script block
- `src/app/page.tsx` — add WebSite JSON-LD
- `src/lib/structured-data.ts` — helper functions to build JSON-LD objects

### 2.5 Full-Text Search

**What it does:** Allows readers to search articles by keyword across titles, excerpts, and content in both languages.

**Implementation approach:**
- Use **Supabase full-text search** via `tsvector` columns. Create a generated column `search_vector` on the `articles` table combining `title_zh`, `title_en`, `excerpt_zh`, `excerpt_en`, `content_zh`, `content_en`.
- Create a Supabase RPC function `search_articles(query text, limit int)` that uses `to_tsquery` with rank.
- Add a search bar component to the header with debounced input.
- Results displayed in a dropdown (instant) or dedicated `/search` page.

**Estimated complexity:** M

**Files to create or modify:**
- Supabase migration: add `search_vector` column + GIN index + RPC function
- `src/app/api/search/route.ts` — GET with `?q=` query param
- `src/app/search/page.tsx` — search results page
- `src/components/SearchBar.tsx` — search input with debounce
- `src/components/Header.tsx` — integrate SearchBar
- `src/lib/articles.ts` — add `searchArticles()` function

---

## Phase 3 — Engagement

> Goal: Build reader interaction and retention features.

### 3.1 Comments System

**What it does:** Allows readers to leave comments on articles, threaded replies, with moderation.

**Implementation approach:**
- Use **Giscus** (GitHub Discussions-backed comments). This is already listed in TODO.md and requires zero backend work.
- Embed `<Giscus>` component on article pages. Configure via `giscus.app` to point to the repo's Discussions.
- Alternatively, for a self-hosted approach: create a `comments` table in Supabase (id, article_id, user_id, parent_id, content, created_at) with RLS. This gives full control but requires moderation UI.
- **Recommendation:** Start with Giscus for speed, migrate to self-hosted later if needed.

**Estimated complexity:** S (Giscus) / L (self-hosted)

**Files to create or modify:**
- `src/components/Comments.tsx` — Giscus wrapper component
- `src/app/articles/[slug]/page.tsx` — embed Comments below article
- `package.json` — add `@giscus/react`

### 3.2 Social Sharing Buttons

**What it does:** Adds share buttons for WeChat, Twitter/X, LinkedIn, and copy-link on each article page.

**Implementation approach:**
- Build a lightweight `ShareButtons` component using native share URLs (no SDK needed).
- Twitter: `https://twitter.com/intent/tweet?url=...&text=...`
- LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=...`
- WeChat: Generate a QR code of the article URL using `qrcode` npm package for scanning.
- Copy link: `navigator.clipboard.writeText()`.
- Add `navigator.share()` as progressive enhancement on mobile.

**Estimated complexity:** S

**Files to create or modify:**
- `src/components/ShareButtons.tsx` — share button row
- `src/app/articles/[slug]/page.tsx` — embed ShareButtons
- `package.json` — add `qrcode` (for WeChat QR)

### 3.3 Dark Mode

**What it does:** Toggleable dark/light theme that respects system preference and persists user choice.

**Implementation approach:**
- Use Tailwind CSS 4's built-in dark mode (`darkMode: 'class'`).
- Store preference in `localStorage` and apply `.dark` class to `<html>`.
- Create a `ThemeToggle` component in the header.
- Define dark color palette: dark background `#1A1A1A`, light text `#E5E3DF`, amber accent `#D4830A` (unchanged).
- Update all inline `style={{ color: '...' }}` in existing components to use CSS variables or Tailwind dark: variants.

**Estimated complexity:** M

**Files to create or modify:**
- `src/components/ThemeToggle.tsx` — toggle button
- `src/components/Header.tsx` — add ThemeToggle
- `src/app/layout.tsx` — add theme script (prevent FOUC), CSS variables
- `src/app/globals.css` — dark mode color variables
- All components with hardcoded colors: `ArticleCard.tsx`, `ArticleContent.tsx`, `Footer.tsx`, `Header.tsx`, `admin/articles/page.tsx` — migrate to CSS variables/Tailwind dark variants

### 3.4 Newsletter Sending

**What it does:** Sends email newsletters to subscribers when new articles are published, using the existing `email_subscribers` table.

**Implementation approach:**
- Use **Resend** (already in `package.json` as a dependency).
- Create an admin UI page to compose/preview a newsletter or auto-generate from a published article.
- Build email templates with `react-email` (JSX-based, renders to HTML).
- API route: `POST /api/admin/newsletter/send` — queries subscribers by language preference, sends via Resend batch API.
- Add unsubscribe link to every email (Resend handles this with `List-Unsubscribe` headers).
- Rate: Resend free tier = 100 emails/day, 3000/month. Sufficient for early stage.

**Estimated complexity:** M

**Files to create or modify:**
- `src/app/admin/newsletter/page.tsx` — newsletter compose/send UI
- `src/app/api/admin/newsletter/send/route.ts` — POST (batch send)
- `src/app/api/unsubscribe/route.ts` — GET with token (unsubscribe handler)
- `src/components/admin/NewsletterComposer.tsx` — compose form with preview
- `src/lib/email-templates/article-newsletter.tsx` — email template (react-email)
- `package.json` — add `@react-email/components`

---

## Phase 4 — Polish

> Goal: Production hardening and operational quality.

### 4.1 Analytics Integration

**What it does:** Tracks page views, unique visitors, top articles, and referral sources.

**Implementation approach:**
- Use **Vercel Analytics** (`@vercel/analytics`) — zero-config, privacy-friendly, already on Vercel. Listed in TODO.md.
- Optionally add **Vercel Speed Insights** (`@vercel/speed-insights`) for Core Web Vitals.
- Add both components to root layout. No database changes needed.

**Estimated complexity:** S

**Files to create or modify:**
- `src/app/layout.tsx` — add `<Analytics />` and `<SpeedInsights />` components
- `package.json` — add `@vercel/analytics`, `@vercel/speed-insights`

### 4.2 Rate Limiting on API Routes

**What it does:** Prevents abuse of public API endpoints (subscribe, search, articles) with per-IP rate limiting.

**Implementation approach:**
- Use **Vercel KV** (Redis-based) with a sliding window rate limiter, or use the `@upstash/ratelimit` package with Upstash Redis (free tier: 10K requests/day).
- Alternatively, for zero-dependency approach: use an in-memory `Map` with IP + timestamp (sufficient for single-region Vercel deployment, resets on cold start).
- Apply as middleware or per-route wrapper.

**Estimated complexity:** S

**Files to create or modify:**
- `src/lib/rate-limit.ts` — rate limiter utility
- `src/middleware.ts` — add rate limiting logic for `/api/*` routes
- `package.json` — add `@upstash/ratelimit`, `@upstash/redis` (if using Upstash)

### 4.3 Error Boundaries

**What it does:** Catches rendering errors gracefully and shows a user-friendly fallback instead of a blank page.

**Implementation approach:**
- Use Next.js App Router's built-in `error.tsx` convention at each route segment.
- Create a global `error.tsx` at `src/app/error.tsx` and segment-level ones for `/articles` and `/admin`.
- Add a `global-error.tsx` for root layout errors.
- Each error page shows a retry button and a link back to home.

**Estimated complexity:** S

**Files to create or modify:**
- `src/app/error.tsx` — global error boundary
- `src/app/global-error.tsx` — root layout error boundary
- `src/app/articles/error.tsx` — articles section error
- `src/app/articles/[slug]/error.tsx` — article detail error
- `src/app/admin/error.tsx` — admin error boundary

### 4.4 Loading States

**What it does:** Shows skeleton placeholders while pages and data are loading, instead of blank content.

**Implementation approach:**
- Use Next.js App Router's built-in `loading.tsx` convention.
- Create skeleton components that match the layout of each page (article cards, article detail, admin table).
- Use Tailwind's `animate-pulse` on placeholder blocks.

**Estimated complexity:** S

**Files to create or modify:**
- `src/app/loading.tsx` — root loading skeleton
- `src/app/articles/loading.tsx` — article list skeleton
- `src/app/articles/[slug]/loading.tsx` — article detail skeleton
- `src/app/admin/loading.tsx` — admin loading skeleton
- `src/components/skeletons/ArticleCardSkeleton.tsx`
- `src/components/skeletons/ArticleDetailSkeleton.tsx`

### 4.5 Article Revision History

**What it does:** Stores previous versions of articles so the admin can view diffs and restore earlier versions.

**Implementation approach:**
- Create an `article_revisions` table in Supabase: `(id, article_id, content_zh, content_en, title_zh, title_en, edited_by, created_at)`.
- On every article save (PUT), insert the current version into `article_revisions` before applying the update (trigger or application-level).
- Admin UI: revision list with timestamps, side-by-side diff view, restore button.
- Diff rendering: use `diff` npm package for text comparison, render with green/red highlighting.

**Estimated complexity:** L

**Files to create or modify:**
- Supabase migration: create `article_revisions` table
- `src/app/admin/articles/[id]/revisions/page.tsx` — revision history page
- `src/app/api/admin/articles/[id]/revisions/route.ts` — GET (list), POST (restore)
- `src/components/admin/RevisionDiff.tsx` — diff viewer component
- `src/lib/admin.ts` — add `saveRevision()`, `getRevisions()`, `restoreRevision()`
- `package.json` — add `diff`

### 4.6 Article Scheduling

**What it does:** Allows setting a future `published_at` date so articles auto-publish at the specified time.

**Implementation approach:**
- Add a `scheduled` status to the article status enum (alongside `draft`, `published`, `archived`).
- In the article editor, allow setting a future `published_at` datetime when status is `scheduled`.
- Use a **Vercel Cron Job** (`vercel.json` cron) that runs every 15 minutes, querying `status = 'scheduled' AND published_at <= now()` and flipping them to `published`.
- API route: `POST /api/cron/publish-scheduled` (secured with `CRON_SECRET` header).

**Estimated complexity:** M

**Files to create or modify:**
- `src/app/api/cron/publish-scheduled/route.ts` — cron handler
- `vercel.json` — add cron configuration
- `src/types/index.ts` — add `'scheduled'` to Article status union
- `src/components/admin/ArticleEditor.tsx` — add scheduled datetime picker
- `src/app/admin/articles/page.tsx` — show scheduled status in table

---

## Phase 5 — AI 能力集成

> Goal: 将 AI 深度集成到博客系统中，超越传统 WordPress/CMS 的能力边界。

### 5.1 AI 写作助手

**What it does:** Admin 编辑器内嵌 AI 助手，支持续写、润色、翻译、摘要生成。

**Implementation approach:**
- 在 ArticleEditor 侧边栏增加 AI 面板
- 调用 Claude/GPT API 实现：选中文本润色、全文摘要、中→英翻译、标题建议、SEO 优化建议
- 使用 streaming response 实时显示生成结果
- API route: `POST /api/admin/ai/assist` — 接收 action + content，返回 stream

**Estimated complexity:** M

**Files to create or modify:**
- `src/app/api/admin/ai/assist/route.ts` — AI 助手 API（streaming）
- `src/components/admin/AIAssistPanel.tsx` — 编辑器内 AI 面板
- `src/components/admin/ArticleEditor.tsx` — 集成 AI 面板

### 5.2 自动翻译 Pipeline

**What it does:** 发布中文文章时自动生成英文翻译，遵循 10 条翻译风格指南。

**Implementation approach:**
- 文章保存时，如果 content_en 为空且 content_zh 有内容，触发自动翻译
- 使用已有的翻译风格指南（`写作风格分析.md`中的 10 条规则）
- 翻译完成后自动填入 content_en/title_en/excerpt_en
- 支持手动触发重新翻译
- API route: `POST /api/admin/ai/translate` — 翻译单篇文章

**Estimated complexity:** M

**Files to create or modify:**
- `src/app/api/admin/ai/translate/route.ts` — 翻译 API
- `src/lib/ai/translation.ts` — 翻译逻辑 + 风格指南 prompt
- `src/components/admin/ArticleEditor.tsx` — 添加"自动翻译"按钮

### 5.3 智能分类和标签

**What it does:** AI 自动分析文章内容，推荐分类和标签。

**Implementation approach:**
- 文章保存时自动分析内容，推荐 category 和 tags
- Admin 可一键采纳或修改建议
- 使用 Claude Haiku（快速、低成本）进行分类
- API route: `POST /api/admin/ai/categorize`

**Estimated complexity:** S

**Files to create or modify:**
- `src/app/api/admin/ai/categorize/route.ts`
- `src/lib/ai/categorize.ts`
- `src/components/admin/ArticleEditor.tsx` — 显示 AI 建议

### 5.4 AI 生成摘要和封面描述

**What it does:** 自动从文章内容生成 excerpt（中英双语）和封面图描述。

**Implementation approach:**
- 文章保存时如果 excerpt 为空，自动生成 2-3 句摘要
- 封面图描述可用于后续自动生成封面或 alt text
- 支持批量处理（为所有缺少摘要的文章生成）

**Estimated complexity:** S

**Files to create or modify:**
- `src/app/api/admin/ai/summarize/route.ts`
- `src/lib/ai/summarize.ts`

### 5.5 智能搜索（语义搜索）

**What it does:** 基于语义理解的搜索，而非仅关键词匹配。读者可以用自然语言问问题。

**Implementation approach:**
- 使用 Supabase `pgvector` 扩展存储文章 embedding
- 文章发布时自动生成 embedding（OpenAI text-embedding-3-small）
- 搜索时将 query 转为 embedding，与文章 embedding 做余弦相似度匹配
- 混合搜索：semantic + full-text search 加权合并
- 可扩展为 RAG 对话式搜索（读者提问，AI 基于文章内容回答）

**Estimated complexity:** L

**Files to create or modify:**
- Supabase migration: 启用 pgvector, 添加 embedding 列 + HNSW 索引
- `src/app/api/admin/ai/embed/route.ts` — 生成 embedding
- `src/app/api/search/route.ts` — 增加语义搜索
- `src/lib/ai/embeddings.ts` — embedding 生成逻辑
- `src/components/SearchBar.tsx` — 增强搜索交互

### 5.6 AI 内容推荐

**What it does:** 基于阅读历史和文章相似度的个性化推荐。

**Implementation approach:**
- 利用文章 embedding 计算相似文章（替代当前仅基于 category 的 related articles）
- 已登录用户：追踪阅读历史，推荐未读的相似文章
- 未登录用户：基于当前文章推荐相似内容
- 首页 "为你推荐" 板块

**Estimated complexity:** M

**Files to create or modify:**
- `src/lib/ai/recommendations.ts`
- `src/app/api/recommendations/route.ts`
- `src/components/RecommendedArticles.tsx`
- `src/app/articles/[slug]/page.tsx` — 替换当前 related articles

---

## Summary Table

| # | Feature | Phase | Complexity | Dependencies |
|---|---------|-------|------------|--------------|
| 1.1 | WYSIWYG Article Editor | 1 | L | `novel` or `milkdown` |
| 1.2 | Media Library UI | 1 | M | Supabase Storage, `sharp` |
| 1.3 | Bulk Import UI | 1 | M | `gray-matter`, `jszip` |
| 2.1 | sitemap.xml | 2 | S | built-in Next.js |
| 2.2 | robots.txt | 2 | S | built-in Next.js |
| 2.3 | RSS Feed | 2 | S | `feed` (optional) |
| 2.4 | Structured Data | 2 | S | none |
| 2.5 | Full-Text Search | 2 | M | Supabase FTS |
| 3.1 | Comments | 3 | S | `@giscus/react` |
| 3.2 | Social Sharing | 3 | S | `qrcode` |
| 3.3 | Dark Mode | 3 | M | Tailwind CSS 4 |
| 3.4 | Newsletter Sending | 3 | M | `resend` (installed), `@react-email/components` |
| 4.1 | Analytics | 4 | S | `@vercel/analytics` |
| 4.2 | Rate Limiting | 4 | S | `@upstash/ratelimit` (optional) |
| 4.3 | Error Boundaries | 4 | S | built-in Next.js |
| 4.4 | Loading States | 4 | S | built-in Next.js |
| 4.5 | Revision History | 4 | L | `diff`, Supabase migration |
| 4.6 | Article Scheduling | 4 | M | Vercel Cron |
| 5.1 | AI 写作助手 | 5 | M | Claude/GPT API |
| 5.2 | 自动翻译 Pipeline | 5 | M | Claude API + 风格指南 |
| 5.3 | 智能分类和标签 | 5 | S | Claude Haiku |
| 5.4 | AI 摘要和封面描述 | 5 | S | Claude API |
| 5.5 | 智能语义搜索 | 5 | L | pgvector + OpenAI Embeddings |
| 5.6 | AI 内容推荐 | 5 | M | pgvector |

---

## Implementation Order Within Each Phase

**Phase 1:** Editor (1.1) first, since Media Library (1.2) integrates into it as a picker. Import (1.3) is independent and can be done in parallel.

**Phase 2:** sitemap (2.1) + robots (2.2) first (30 min each). RSS (2.3) and structured data (2.4) next (both small). Search (2.5) last (needs DB migration).

**Phase 3:** Comments (3.1, Giscus) and sharing (3.2) are quick wins to ship first. Dark mode (3.3) is a cross-cutting change best done in one focused session. Newsletter (3.4) last since it needs email template design and testing.

**Phase 4:** Analytics (4.1), error boundaries (4.3), and loading states (4.4) are all quick wins. Rate limiting (4.2) next. Scheduling (4.6) and revision history (4.5) last as they need DB changes.
