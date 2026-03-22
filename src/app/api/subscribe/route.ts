import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const rl = rateLimit(ip)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: getRateLimitHeaders(rl) })
  }

  try {
    const body = await req.json()
    const { email, language = 'both' } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (!['zh', 'en', 'both'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language preference' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('email_subscribers')
      .select('id, confirmed')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json(
        { message: 'Already subscribed', alreadySubscribed: true },
        { status: 200 }
      )
    }

    const { error } = await supabase.from('email_subscribers').insert({
      email: email.toLowerCase(),
      language,
      confirmed: false,
    })

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to subscribe. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Subscribed successfully' }, { status: 200 })
  } catch (err) {
    console.error('Subscribe route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
