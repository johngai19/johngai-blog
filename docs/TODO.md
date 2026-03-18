# Development TODO

*Updated: 2026-03-19*

---

## Critical (Before Public Launch)

- [x] Next.js project setup + Tailwind + TypeScript
- [x] Supabase database schema (articles, profiles, subscriptions)
- [x] GitHub OAuth login
- [x] Stripe products (Pro $19, Elite $199)
- [x] Stripe Checkout + Webhook
- [x] Admin dashboard (articles, subscribers, stats)
- [x] User dashboard (profile, subscription, billing)
- [x] Email subscription form
- [x] Custom logo + favicon (DALL-E 3 generated)
- [x] Cover images for initial articles
- [x] Article dates corrected to original
- [x] Tags unified to English-only
- [x] GitHub Actions CI (typecheck + build)
- [x] CLAUDE.md for agent development
- [ ] **Article English translations** (4/5 remaining, agent translating)
- [ ] **Test full login → subscribe → pay flow end-to-end**
- [ ] **Stripe Customer Portal configuration** (in Stripe Dashboard)
- [ ] **SEO: sitemap.xml + robots.txt**
- [ ] **OG meta images per article** (dynamic with @vercel/og)

## High Priority (Week 1 Post-Launch)

- [ ] GitHub → Vercel auto-deploy integration (currently manual API trigger)
- [ ] Dark mode support
- [ ] Comment system (Giscus via GitHub Discussions)
- [ ] Vercel Analytics integration
- [ ] Rate limiting on API routes
- [ ] Newsletter system (Resend API)
- [ ] Article search (full-text via Supabase)

## Medium Priority (Month 1)

- [ ] Cloudflare R2 for media storage (replace local public/covers/)
- [ ] AI article summary (Vercel AI SDK)
- [ ] Related articles semantic recommendation
- [ ] Reading history + bookmarks (for logged-in users)
- [ ] RSS feed
- [ ] i18n routing with next-intl (/zh/... and /en/...)
- [ ] Podcast module (Podbean integration)
- [ ] Article series/collections support

## Low Priority (Future)

- [ ] ailame AI companion (Elite membership feature)
- [ ] Vercel AI Gateway for cost control
- [ ] A/B testing on headlines
- [ ] Email course / drip sequences
- [ ] Mobile PWA support
- [ ] Annual pricing option (10% discount)

## Content Pipeline

- [ ] Process 876 articles through publish-article skill
- [ ] Generate cover images for all articles (batch DALL-E 3)
- [ ] Build automated daily article publishing pipeline
- [ ] Style guide v3.0 (after first 50 articles processed)
- [ ] Domain migration from WordPress.com DNS to GoDaddy

## Technical Debt

- [ ] middleware.ts: switch from getSession() to getUser() (Supabase recommendation)
- [ ] Deduplicate env var entries in .env.local
- [ ] Move cover images to CDN (Cloudflare R2)
- [ ] Add error boundaries to all pages
- [ ] Proper loading.tsx skeletons for each route
- [ ] Test coverage (Vitest + Testing Library)
