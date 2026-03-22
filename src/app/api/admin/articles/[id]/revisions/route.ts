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

// GET — list revisions for an article (summary only, no full content)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdmin(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from('article_revisions')
    .select('id, article_id, title_zh, title_en, edited_by, created_at, content_zh, content_en')
    .eq('article_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return summary: include content lengths but not full content
  const revisions = (data ?? []).map((r) => ({
    id: r.id,
    article_id: r.article_id,
    title_zh: r.title_zh,
    title_en: r.title_en,
    edited_by: r.edited_by,
    created_at: r.created_at,
    content_zh_len: (r.content_zh ?? '').length,
    content_en_len: (r.content_en ?? '').length,
    content_zh: r.content_zh,
    content_en: r.content_en,
  }))

  return NextResponse.json(revisions)
}

// POST with { revisionId } — restore a specific revision to the article
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdmin(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { revisionId } = body as { revisionId: string }

  if (!revisionId) return NextResponse.json({ error: 'Missing revisionId' }, { status: 400 })

  const supabase = getServiceClient()

  // Fetch the revision
  const { data: revision, error: revErr } = await supabase
    .from('article_revisions')
    .select('title_zh, title_en, content_zh, content_en')
    .eq('id', revisionId)
    .eq('article_id', id)
    .single()

  if (revErr || !revision) {
    return NextResponse.json({ error: 'Revision not found' }, { status: 404 })
  }

  // Save current article state as a new revision before restoring
  const { data: currentArticle } = await supabase
    .from('articles')
    .select('title_zh, title_en, content_zh, content_en')
    .eq('id', id)
    .single()
  if (currentArticle) {
    await supabase.from('article_revisions').insert({
      article_id: id,
      title_zh: currentArticle.title_zh,
      title_en: currentArticle.title_en,
      content_zh: currentArticle.content_zh,
      content_en: currentArticle.content_en,
      edited_by: 'admin',
    })
  }

  // Restore the revision
  const now = new Date().toISOString()
  const { data: updated, error: updateErr } = await supabase
    .from('articles')
    .update({
      title_zh: revision.title_zh,
      title_en: revision.title_en,
      content_zh: revision.content_zh,
      content_en: revision.content_en,
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single()

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, article: updated })
}
