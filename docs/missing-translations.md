# Articles Missing `content_en`

> **Status: RESOLVED** (2026-04-07 round 12) — All 8 articles translated by Claude, pushed to Supabase.
> Original: 2026-04-07 | Total: 8 articles | All are `status: published`, `category: writing`

| # | ID (short) | Slug | Title (EN) | Published |
|---|-----------|------|------------|-----------|
| 1 | `19bfd99e` | 回答神舟笔记本为什么那么廉价靠谱吗-93958b97 | Why Are Hasee Laptops So Cheap — Are They Reliable? | 2026-03-22 |
| 2 | `1de8eb6b` | 异曲同工windowslinux和mac-3e798b91 | Same Goal, Different Paths — Formatting External Drives via CLI on Windows, Linux, and macOS | 2026-03-22 |
| 3 | `226566dc` | 长风破浪会有时直挂云帆济沧海-b3b9e2cd | Setting Sail Through Winds and Waves — A Journey of Ambition | 2026-03-22 |
| 4 | `43471adf` | 回答非标自动化设备维修员职业发展方向有哪-bc411c34 | Career Paths for Non-Standard Automation Equipment Technicians | 2026-03-22 |
| 5 | `5dba2c20` | 我们该如何面对现代生活中无处不在的焦虑阿-b8bb38e1 | How Should We Face Ubiquitous Modern Anxiety? — Lessons from Alain de Botton's Status Anxiety | 2026-03-22 |
| 6 | `e5172439` | 回答编程自动化似乎已经是大势所趋什么时候-03b6198a | When Will Programming Automation Truly Arrive? | 2026-03-22 |
| 7 | `e91c9454` | 回答智慧能源未来前景如何-2c877338 | What Is the Future of Smart Energy? | 2026-03-22 |
| 8 | `f5e67824` | 回答妈妈是一个扶弟魔怎么办-ae059d06 | How to Deal with a Mother Who Over-Supports Her Siblings | 2026-03-22 |

## Query Used

```sql
SELECT id, slug, title_zh, title_en, category, published_at
FROM articles
WHERE status = 'published'
  AND (content_en IS NULL OR content_en = '')
ORDER BY id;
```

## Notes

- All 8 are in the `writing` category, published on the same date (2026-03-22)
- `title_en` is already populated for all 8 -- only `content_en` body text is missing
- These appear to be older Zhihu Q&A reposts from the WordPress migration batch
