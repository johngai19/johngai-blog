# Quality Audit Report

Created: 2026-04-07
Status: open

---

## 1. External Image Audit

### Summary
- **25 articles** contain **173 external image URLs** that may break due to hotlink protection or domain expiry.
- **8 articles** still reference **weizhiyong.com** (36 URLs) despite the WordPress migration script having processed 224 images previously.
- Cover images are clean: 288 local/Supabase, 0 external, 1,320 articles have no cover.

### External Image Domains (by frequency)

| Domain | Count | Risk | Notes |
|--------|-------|------|-------|
| codelabs.developers.google.com | 36 | Low | Google-hosted, stable |
| www.wesinx.com | 25 | High | Company site, may go down |
| pic1/2/3/4.zhimg.com (Zhihu) | 74 | High | Zhihu hotlink protection active |
| omdmz8z30.bkt.clouddn.com | 10 | Critical | Qiniu CDN, likely expired |
| storage.googleapis.com | 8 | Low | Google-hosted, stable |
| upload.wikimedia.org | 4 | Low | Wikimedia, stable |
| Various (obsproject, joplin, etc.) | 16 | Medium | Third-party project sites |

### WordPress Migration Status
- Mapping file: `scripts/wp-image-url-mapping.json` (224 entries)
- Remaining weizhiyong.com references: 8 articles, 36 URLs
- Action needed: Run `node scripts/backup-wordpress-images.mjs` again (images may have failed previously)

### Recommended Actions
1. **P1**: Re-run WordPress image backup script to clear remaining 36 weizhiyong.com refs
2. **P1**: Backup Zhihu images (74 URLs) -- hotlink protection will break these
3. **P2**: Backup wesinx.com images (25 URLs) and Qiniu CDN images (10 URLs, likely already broken)
4. **P3**: Extend `backup-wordpress-images.mjs` to handle non-WordPress domains, or write a generic external image migration script

---

## 2. SEO Audit

### What's Working
- `robots.ts`: Properly blocks /admin, /dashboard, /api; includes sitemap URL
- `sitemap.ts`: Paginates through all articles (1,608+), includes static pages
- Article detail page: Full OpenGraph + Twitter Card meta, JSON-LD structured data, canonical URLs, hreflang alternates
- OG image: Falls back to `/api/og` dynamic generation when no cover_image
- RSS feed at `/feed.xml`

### Issues Found and Fixed
- **CATEGORY_LABELS** lacked dark mode color classes -- FIXED (all 6 categories)
- **Search page (SearchContent.tsx)** had 10+ hardcoded light-mode colors via `style={}` -- FIXED (replaced with Tailwind dark: variants)
- **Articles list page** had static metadata ("Articles" / "All articles by John Wei") -- FIXED (now dynamic: language-aware, category-aware title/description)

### Remaining Issues
- **15 files** still use hardcoded light-mode colors via `style={{}}` instead of Tailwind dark: classes. Public-facing: `pricing/page.tsx`, `subscribe/page.tsx`, `login/page.tsx`, `SubscribeForm.tsx`, `AuthButton.tsx`. Admin-only: 7 files.
- **middleware.ts** uses deprecated `getSession()` -- Supabase recommends `getUser()` (see TODO.md technical debt section)
- Subscribe and pricing pages have static metadata without language awareness

---

## 3. i18n Routes

### Current State
- Language is entirely **query-param based** (`?lang=zh` / `?lang=en`)
- Default language: English (if no `?lang` param, defaults to `en`)
- All internal links pass `?lang=` through
- Header has a language toggle button that updates the `lang` query param
- `ArticleContent.tsx` shows a "Read in English" / "Read in Chinese" link (same page, different `?lang=`)
- Canonical URL for articles: `https://www.johngai.com/articles/{slug}` (no lang in path)
- hreflang alternates: `?lang=zh` and `?lang=en` (correct for current implementation)

### Assessment
- Query-param i18n is functional but not ideal for SEO. Google treats `?lang=zh` as the same page as `?lang=en` unless hreflang is properly set (which it is for article pages, but not for other pages).
- Path-based i18n (`/zh/articles/...`, `/en/articles/...`) is listed as "Medium Priority" in TODO.md. This would require `next-intl` or similar middleware and is a large refactor.
- **No action needed now** -- the current approach works, hreflang is set on article pages. Worth doing as a dedicated project later.

---

## 4. Content Quality / UX

### What's Working
- Homepage: Clean design with hero article, latest articles grid, category browse, subscribe CTA
- Article list: Category filter, language toggle, pagination (12 per page)
- Article detail: Reading progress bar, TOC (desktop sidebar + mobile floating), social share, related articles, comments (Giscus)
- Search: Header search bar with dropdown autocomplete + full search page at `/search`
- 404 page: Shows popular articles, search bar, navigation links

### Issues Found
- **1,320 articles (82%) have no cover image** -- renders gradient placeholder with emoji, which is functional but less visually engaging for browsing
- **Search page** default language is `zh` in `SearchContent.tsx` (line 122: `searchParams.get('lang') === 'en' ? 'en' : 'zh'`) while the rest of the site defaults to `en`. This is inconsistent.

---

## 5. Summary of Changes Made

| File | Change |
|------|--------|
| `src/types/index.ts` | Added dark mode classes to all 6 CATEGORY_LABELS color definitions |
| `src/app/search/SearchContent.tsx` | Replaced ~15 hardcoded `style={{color/backgroundColor}}` with Tailwind dark: classes |
| `src/app/articles/page.tsx` | Made `generateMetadata()` dynamic: language-aware + category-aware title/description |

Build: passes (`npm run build` successful).
