# Blog UX and Sharing Issues

Created: 2026-04-06
Status: open
Priority: P0-P1

## Issue 1 — 分享时没有缩略图（OG image / social preview missing）

### 症状
- 在聊天工具或社交平台分享博客文章时，没有稳定显示缩略图。

### 初步判断
- 文章页 `generateMetadata()` 已输出 `openGraph.images` 与 `twitter.images`，但当前实现直接使用 `article.cover_image`。
- 当 `cover_image` 是类似 `/covers/xxx.svg` 的**相对路径**时，`og:image` 也会变成相对路径，而很多社交抓取器更依赖**绝对 URL**，这会导致分享卡片没有缩略图。
- 只有 fallback 的 `/api/og?...` 路径是拼了 `SITE_URL` 的绝对地址；一旦文章本身有 `cover_image`，当前实现就不会再走这个绝对地址 fallback。
- 因此，问题更接近：**metadata 已有，但 OG image URL 不够稳健（相对路径 vs 绝对路径）**。

### 排查方向
1. 检查 `generateMetadata` / article page metadata 是否输出 `openGraph.images` 与 `twitter.images`
2. 检查 `cover_image` 是否为线上可访问 URL
3. 检查分享抓取器拿到的 HTML `<meta property="og:image">`
4. 检查 Vercel 部署后静态资源路径是否可访问

### 期望行为
- 分享任意文章时，应稳定展示标题、摘要、缩略图。

---

## Issue 2 — 顶部中英文按钮与正文切换逻辑分裂

### 症状
- 页面顶部语言按钮只修改标题/页面层语言状态
- 正文区域内部又有一个单独切换正文的按钮
- 导致用户感觉像有两套语言系统

### 初步判断
- 页面级语言状态与正文组件内部语言状态未统一。
- 当前实现已经确认是：
  - `src/app/articles/[slug]/page.tsx` 用 `searchParams.lang` 决定标题、摘要、metadata、当前正文初始语言
  - `src/components/ArticleContent.tsx` 又用 `useState(initialLang)` 单独维护了一套 `contentLang` 本地状态，并渲染正文内部切换按钮
- 这意味着页面顶部的语言切换与正文内部切换并不是同一个 source of truth。
- 结果就是：标题/metadata/URL 可以来自页面层，而正文又能在组件内部独立切换，造成明显割裂。

### 风险
- 用户体验割裂
- 分享 URL 不能稳定表达当前语言版本
- SEO / canonical / alternates / social preview 可能不一致

### 期望行为
- 页面只存在一个语言 source of truth
- 顶部切换 = 标题、正文、metadata、URL 一起切换
- 移除正文内部重复切换入口，或让其仅作为同一个状态的镜像控件

---

## 建议优先级
- P0：统一文章详情页的语言 source of truth
- P0：修复社交分享缩略图
- P1：检查全站 i18n route / metadata / share URL 一致性
