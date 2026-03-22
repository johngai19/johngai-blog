import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  // Verify CRON_SECRET header
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('articles')
    .update({ status: 'published' })
    .eq('status', 'scheduled')
    .lte('published_at', now)
    .select('id, slug, title_zh')

  if (error) {
    console.error('[cron/publish-scheduled] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const count = data?.length ?? 0
  console.log(`[cron/publish-scheduled] Published ${count} article(s)`)

  return NextResponse.json({ published: count, articles: data })
}
