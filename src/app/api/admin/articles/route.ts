import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

async function verifyAdmin(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      },
    }
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail && user.email !== adminEmail) return null
  return user
}

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

function calcReadingTime(contentZh: string | null, contentEn: string | null): number {
  const zhChars = (contentZh ?? '').replace(/\s/g, '').length
  const enWords = (contentEn ?? '').split(/\s+/).filter(Boolean).length
  const zhMin = zhChars / 500
  const enMin = enWords / 200
  return Math.max(1, Math.round(Math.max(zhMin, enMin)))
}

// GET — fetch single article by id for editing
export async function GET(request: NextRequest) {
  const user = await verifyAdmin(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = getServiceClient()
  const { data, error } = await supabase.from('articles').select('*').eq('id', id).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

// POST — create new article
export async function POST(request: NextRequest) {
  const user = await verifyAdmin(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const supabase = getServiceClient()

  const slug = body.slug || slugify(body.title_en || body.title_zh || 'untitled')

  // Check slug uniqueness
  const { data: existing } = await supabase.from('articles').select('id').eq('slug', slug).single()
  if (existing) {
    return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 409 })
  }

  const now = new Date().toISOString()
  const record = {
    slug,
    title_zh: body.title_zh || null,
    title_en: body.title_en || null,
    content_zh: body.content_zh || null,
    content_en: body.content_en || null,
    excerpt_zh: body.excerpt_zh || null,
    excerpt_en: body.excerpt_en || null,
    cover_image: body.cover_image || null,
    category: body.category || null,
    tags: body.tags || [],
    status: body.status || 'draft',
    source: body.source || null,
    source_url: body.source_url || null,
    published_at: body.published_at || (body.status === 'published' ? now : null),
    reading_time_min: calcReadingTime(body.content_zh, body.content_en),
    created_at: now,
    updated_at: now,
  }

  const { data, error } = await supabase.from('articles').insert(record).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}

// PUT — update existing article
export async function PUT(request: NextRequest) {
  const user = await verifyAdmin(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = getServiceClient()

  // If slug changed, check uniqueness
  if (body.slug) {
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', body.slug)
      .neq('id', body.id)
      .single()
    if (existing) {
      return NextResponse.json({ error: `Slug "${body.slug}" already exists` }, { status: 409 })
    }
  }

  const now = new Date().toISOString()
  const updates: Record<string, unknown> = { updated_at: now }

  const fields = [
    'slug',
    'title_zh',
    'title_en',
    'content_zh',
    'content_en',
    'excerpt_zh',
    'excerpt_en',
    'cover_image',
    'category',
    'tags',
    'status',
    'source',
    'source_url',
    'published_at',
  ]
  for (const f of fields) {
    if (f in body) updates[f] = body[f]
  }

  // Auto-set published_at when first publishing
  if (body.status === 'published' && !body.published_at) {
    const { data: current } = await supabase
      .from('articles')
      .select('published_at')
      .eq('id', body.id)
      .single()
    if (!current?.published_at) {
      updates.published_at = now
    }
  }

  updates.reading_time_min = calcReadingTime(
    body.content_zh ?? null,
    body.content_en ?? null
  )

  const { data, error } = await supabase
    .from('articles')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — delete article
export async function DELETE(request: NextRequest) {
  const user = await verifyAdmin(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = getServiceClient()
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
