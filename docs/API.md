# API Reference

Base URL: `https://johngai.com/api`

---

## Articles

### GET /api/articles

List articles with pagination and filtering.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 12 | Articles per page |
| `category` | string | — | Filter by category slug |
| `lang` | `zh`\|`en` | `zh` | Preferred language |
| `status` | string | `published` | Article status filter |
| `slug` | string | — | Get single article by slug |

**Response:**
```json
{
  "articles": [
    {
      "id": "uuid",
      "slug": "leaving-the-forest",
      "title_zh": "走出挪威的森林",
      "title_en": "Leaving the Forest",
      "excerpt_zh": "...",
      "excerpt_en": "...",
      "cover_image": "/covers/leaving-the-forest.png",
      "category": "books",
      "tags": ["murakami", "reading"],
      "status": "published",
      "published_at": "2024-10-05T09:54:13Z",
      "reading_time_min": 8,
      "view_count": 42
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 12
}
```

---

## Subscription

### POST /api/subscribe

Add email to newsletter.

**Body:**
```json
{
  "email": "user@example.com",
  "language": "zh"  // "zh" | "en" | "both"
}
```

**Response:** `201` on success, `400` on invalid email, `409` on duplicate.

---

## Authentication

### GET /auth/callback

Supabase OAuth callback. Exchanges auth code for session.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `code` | string | Auth code from Supabase |
| `next` | string | Redirect path after login |

---

## Stripe

### POST /api/stripe/create-checkout

Create Stripe Checkout session. **Requires auth.**

**Body:**
```json
{
  "plan": "pro"  // "pro" | "elite"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### POST /api/stripe/webhook

Stripe webhook handler. Verifies `stripe-signature` header.

**Events handled:**
- `checkout.session.completed` → create subscription
- `customer.subscription.updated` → update status
- `customer.subscription.deleted` → downgrade to free
- `invoice.payment_failed` → mark past_due

### POST /api/stripe/portal

Create Stripe Customer Portal session. **Requires auth.**

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

---

## Admin (requires ADMIN_EMAIL match)

Admin pages are server-rendered at `/admin/*`. No REST API — data fetched directly from Supabase in Server Components.

| Page | Description |
|------|-------------|
| `/admin` | Dashboard: article counts, subscriber counts, MRR |
| `/admin/articles` | Article management (publish/unpublish/bulk) |
| `/admin/subscribers` | Email + auth subscribers, CSV export |
