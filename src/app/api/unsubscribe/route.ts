import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  if (!email || !token) {
    return new NextResponse(
      renderPage('Invalid Link', 'Missing email or token parameter.', false),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  // Validate token: base64url(email) == token
  let expectedToken: string
  try {
    expectedToken = Buffer.from(email).toString('base64url')
  } catch {
    return new NextResponse(
      renderPage('Invalid Link', 'Could not process unsubscribe request.', false),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  if (token !== expectedToken) {
    return new NextResponse(
      renderPage('Invalid Token', 'The unsubscribe link is invalid or has expired.', false),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  const { error } = await supabase
    .from('email_subscribers')
    .update({ confirmed: false })
    .eq('email', email)

  if (error) {
    console.error('[Unsubscribe] Supabase error:', error)
    return new NextResponse(
      renderPage('Error', 'Something went wrong. Please try again later.', false),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  return new NextResponse(
    renderPage(
      '取消订阅成功 / Unsubscribed',
      `${email} has been removed from our newsletter list. You will no longer receive emails from johngai.com.\n\n${email} 已从订阅列表中移除。`,
      true
    ),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

function renderPage(title: string, message: string, success: boolean): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://johngai.com'
  const color = success ? '#16A34A' : '#DC2626'
  const paragraphs = message
    .split('\n\n')
    .map((p) => `<p style="margin:0 0 12px;color:#374151;line-height:1.6;">${p.trim()}</p>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#F9FAFB;font-family:Georgia,serif;">
  <div style="max-width:480px;margin:80px auto;padding:40px;background:#FFFFFF;border-radius:12px;border:1px solid #E5E3DF;text-align:center;">
    <div style="width:56px;height:56px;border-radius:50%;background-color:${success ? '#F0FDF4' : '#FEF2F2'};margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
      <span style="font-size:28px;">${success ? '✓' : '✗'}</span>
    </div>
    <h1 style="font-size:22px;font-weight:700;color:#1A1A1A;margin:0 0 16px;">${title}</h1>
    ${paragraphs}
    <a href="${siteUrl}" style="display:inline-block;margin-top:24px;padding:10px 24px;background-color:#1A1A1A;color:#FFFFFF;text-decoration:none;border-radius:8px;font-size:14px;">返回首页 / Back to site</a>
  </div>
</body>
</html>`
}
