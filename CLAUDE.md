# johngai-blog — Agent 开发指南

## 项目概要

johngai.com 双语个人博客。Next.js 15 + Supabase + Stripe + Vercel。

## 快速命令

```bash
npm run dev          # 本地开发 http://localhost:3000
npm run build        # 生产构建
npm run lint         # ESLint
npx tsc --noEmit     # 类型检查
```

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 15 (App Router, TypeScript) |
| 样式 | Tailwind CSS |
| 数据库 | Supabase (PostgreSQL) |
| 认证 | Supabase Auth (GitHub OAuth + Magic Link) |
| 支付 | Stripe (Pro $19/月, Elite $199/月) |
| 部署 | Vercel (自动部署 from GitHub main) |
| 媒体 | public/covers/ (本地), 未来迁移 Cloudflare R2 |

## 项目结构

```
src/
├── app/
│   ├── page.tsx              # 首页
│   ├── layout.tsx            # 根布局 (Inter + Noto Serif SC)
│   ├── articles/
│   │   ├── page.tsx          # 文章列表 (分类/分页/语言)
│   │   └── [slug]/page.tsx   # 文章详情 (双语切换/TOC/Markdown)
│   ├── login/page.tsx        # 登录 (GitHub + Magic Link)
│   ├── pricing/page.tsx      # 定价页 (Free/Pro/Elite)
│   ├── dashboard/
│   │   ├── page.tsx          # 用户中心
│   │   └── billing/page.tsx  # 账单管理
│   ├── admin/
│   │   ├── page.tsx          # 管理后台首页
│   │   ├── articles/page.tsx # 文章管理
│   │   └── subscribers/page.tsx # 订阅用户
│   ├── subscribe/page.tsx    # 邮件订阅
│   └── api/
│       ├── subscribe/route.ts
│       ├── articles/route.ts
│       ├── auth/callback/route.ts
│       └── stripe/
│           ├── create-checkout/route.ts
│           ├── webhook/route.ts
│           └── portal/route.ts
├── components/
│   ├── Header.tsx            # 导航 + AuthButton + 语言切换
│   ├── Footer.tsx
│   ├── ArticleCard.tsx       # 文章卡片
│   ├── ArticleContent.tsx    # 双语 Markdown 渲染 + TOC
│   ├── SubscribeForm.tsx     # 邮件订阅表单
│   └── AuthButton.tsx        # 登录/用户菜单
├── lib/
│   ├── supabase.ts           # Browser + Server 客户端
│   ├── articles.ts           # 文章数据访问
│   ├── stripe.ts             # Stripe SDK (server-only)
│   ├── plans.ts              # 订阅计划配置 (client-safe)
│   └── utils.ts              # cn(), formatDate()
├── types/
│   └── index.ts              # Article, EmailSubscriber, Lang
└── middleware.ts              # Auth 保护 /dashboard /admin
```

## 数据库表

| 表 | 用途 | RLS |
|---|---|---|
| articles | 文章 (双语, slug 唯一) | public read |
| email_subscribers | 邮件订阅 | service role only |
| profiles | 用户资料 (关联 auth.users) | own row only |
| subscriptions | Stripe 订阅记录 | own row only |

## 文章 Schema 关键字段

```typescript
{
  slug: string           // URL 标识
  title_zh / title_en    // 双语标题
  content_zh / content_en // Markdown 正文
  excerpt_zh / excerpt_en // 摘要 (150字/词)
  cover_image: string    // /covers/{slug}.png
  category: string       // engineering|industry|books|life|startup|writing
  tags: string[]         // 全英文, 小写, 连字符
  status: 'draft'|'published'
  published_at: string   // 原始发布日期 (非当前!)
  reading_time_min: number
}
```

## 环境变量

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Stripe
STRIPE_SECRET_KEY
STRIPE_PRO_PRICE_ID=price_1TCLD5C08DPH000k21CXF0mR
STRIPE_ELITE_PRICE_ID=price_1TCLD6C08DPH000kaeZG5ylZ
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_EMnbI6CMyKAbk2R3UnA9UMkO00gpWVppOf

# Site
NEXT_PUBLIC_SITE_URL=https://johngai.com
ADMIN_EMAIL=sandcabin83@gmail.com
OPENAI_API_KEY  # 封面图生成
```

## 开发规范

### 组件
- Server Component 默认, 只在需要交互时用 `'use client'`
- Stripe SDK (`stripe.ts`) **仅服务端**, 客户端用 `plans.ts`
- 所有 Supabase 写操作用 Service Role Key

### 文章内容
- 中文标点全角 (，。；：)
- 标签全英文小写 (e.g. `murakami`, `book-review`)
- 分类用 6 个固定 slug
- `published_at` 必须是原始日期
- 英文翻译遵循 `_Agent/skills/publish-article.md` 的 10 条规则

### 样式
- 主色: 暖白 `#FAFAF8`, 炭黑 `#1A1A1A`, 琥珀 `#D4830A`
- 中文正文: Noto Serif SC
- UI 文字: Inter
- 不要花哨动画, 保持文人气质

## 部署

推送到 `main` 分支即触发 Vercel 自动部署。
CI 流程: TypeScript 检查 → Lint → Build。

## 备份

每日自动备份到 `johngai19/johngai-backup` (私有仓库)。
手动备份: `bash scripts/backup/backup-to-github.sh`
