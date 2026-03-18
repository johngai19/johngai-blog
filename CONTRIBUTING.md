# Contributing to johngai-blog

## Getting Started

```bash
git clone https://github.com/johngai19/johngai-blog.git
cd johngai-blog
npm install
cp .env.local.example .env.local  # fill in your keys
npm run dev
```

## Branch Strategy

- `main` — production (auto-deploys to Vercel)
- `feature/*` — new features (PR to main)
- `fix/*` — bug fixes (PR to main)

## Development Flow

1. Create a feature branch from `main`
2. Make changes with TypeScript types
3. Run `npx tsc --noEmit` to type-check
4. Run `npm run build` to verify production build
5. Create PR — CI runs automatically
6. Merge to `main` → auto-deploys to Vercel

## Code Style

- TypeScript strict mode
- Server Components by default
- `'use client'` only when interactive
- Tailwind CSS for styling
- No inline styles except dynamic values

## Content Guidelines

All article content follows the style guide in Obsidian:
`Projects/johngai-bilingual/写作风格分析.md`

Key rules:
- English tags only (lowercase, hyphenated)
- 6 fixed categories: engineering, industry, books, life, startup, writing
- Published dates must be original (not current)
- English translations follow 10 rules (see `_Agent/skills/publish-article.md`)
