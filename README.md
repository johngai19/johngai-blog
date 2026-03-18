# johngai.com — Bilingual Tech & Life Blog

A modern bilingual (Chinese/English) personal blog built with Next.js 15, Supabase, and Stripe. Deployed on Vercel.

**Live**: [https://johngai.com](https://johngai.com)

## Features

- **Bilingual content** — Chinese and English versions of every article with tab switching
- **Subscription system** — Free newsletter + Pro ($19/mo) + Elite ($199/mo) via Stripe
- **Admin dashboard** — Article management, subscriber stats, MRR tracking
- **GitHub OAuth + Magic Link** — Passwordless authentication via Supabase Auth
- **AI-powered** — Cover images (DALL-E 3), content translation pipeline
- **Daily backups** — Automated to private GitHub repo with 4-version retention

## Tech Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase · Stripe · Vercel

## Quick Start

```bash
git clone https://github.com/johngai19/johngai-blog.git
cd johngai-blog
npm install
cp .env.local.example .env.local  # fill in your credentials
npm run dev
```

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](CLAUDE.md) | Agent development guide (project structure, conventions, commands) |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution workflow and code style |
| [docs/API.md](docs/API.md) | REST API reference |
| [docs/TODO.md](docs/TODO.md) | Development roadmap and task tracking |

## Architecture

```
Browser → Vercel (CDN + SSR) → Supabase (PostgreSQL + Auth) → Stripe (Payments)
                                     ↓
                              Article content (zh/en)
                              User profiles
                              Subscription records
```

## Content Pipeline

876 articles from 4 sources (weizhiyong.com, johngai.com, Zhihu, Baidu Space) are being processed through an automated pipeline: Chinese cleanup → English translation → cover image generation → Supabase upload.

Translation follows a 10-rule style guide derived from analysis of the author's 17 years of writing.

## License

Private. All rights reserved.
