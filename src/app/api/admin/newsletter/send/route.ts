import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateUnsubscribeToken(email: string): string {
  return Buffer.from(email).toString('base64url')
}

function buildEmailHtml(opts: {
  subject: string
  content: string
  email: string
  siteUrl: string
  lang: 'zh' | 'en'
}): string {
  const { subject, content, email, siteUrl, lang } = opts
  const unsubToken = generateUnsubscribeToken(email)
  const unsubUrl = `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`

  const unsubLabel = lang === 'zh' ? '取消订阅' : 'Unsubscribe'
  const footerText =
    lang === 'zh'
      ? `您收到此邮件是因为您订阅了 johngai.com 的Newsletter。`
      : `You received this email because you subscribed to johngai.com newsletter.`

  // Convert basic markdown-ish content to HTML paragraphs
  const htmlContent = content
    .split('\n\n')
    .map((para) => {
      const trimmed = para.trim()
      if (!trimmed) return ''
      if (trimmed.startsWith('# ')) {
        return `<h1 style="font-size:24px;font-weight:700;margin:24px 0 12px;color:#1A1A1A;">${trimmed.slice(2)}</h1>`
      }
      if (trimmed.startsWith('## ')) {
        return `<h2 style="font-size:20px;font-weight:600;margin:20px 0 10px;color:#1A1A1A;">${trimmed.slice(3)}</h2>`
      }
      if (trimmed.startsWith('### ')) {
        return `<h3 style="font-size:16px;font-weight:600;margin:16px 0 8px;color:#1A1A1A;">${trimmed.slice(4)}</h3>`
      }
      return `<p style="margin:0 0 16px;line-height:1.7;color:#374151;">${trimmed}</p>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#F9FAFB;font-family:${lang === 'zh' ? '"Noto Serif SC", Georgia, serif' : 'Georgia, serif'};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E5E3DF;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1A1A1A;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${siteUrl}" style="text-decoration:none;color:#FFFFFF;">
                      <span style="display:inline-block;width:28px;height:28px;background-color:#D4830A;border-radius:50%;text-align:center;line-height:28px;font-weight:700;font-size:14px;color:#FFFFFF;margin-right:8px;">J</span>
                      <span style="font-size:16px;font-weight:600;color:#FFFFFF;vertical-align:middle;">johngai.com</span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Subject -->
          <tr>
            <td style="padding:32px 32px 0;">
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#1A1A1A;line-height:1.3;">${subject}</h1>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:16px 32px;">
              <hr style="border:none;border-top:2px solid #D4830A;width:48px;margin:0;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:0 32px 32px;">
              ${htmlContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:#F9FAFB;border-top:1px solid #E5E3DF;">
              <p style="margin:0 0 8px;font-size:12px;color:#9CA3AF;">${footerText}</p>
              <a href="${unsubUrl}" style="font-size:12px;color:#D4830A;text-decoration:underline;">${unsubLabel}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

interface SendNewsletterBody {
  subject_zh?: string
  subject_en?: string
  content_zh?: string
  content_en?: string
  articleSlug?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: SendNewsletterBody = await req.json()

    let { subject_zh, subject_en, content_zh, content_en } = body
    const { articleSlug } = body

    // If articleSlug is provided, auto-generate from article content
    if (articleSlug) {
      const { data: article, error: articleError } = await supabase
        .from('articles')
        .select('title_zh, title_en, excerpt_zh, excerpt_en, content_zh, content_en, slug')
        .eq('slug', articleSlug)
        .single()

      if (articleError || !article) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://johngai.com'
      const articleUrl = `${siteUrl}/articles/${article.slug}`

      if (!subject_zh) subject_zh = article.title_zh ?? ''
      if (!subject_en) subject_en = article.title_en ?? ''

      if (!content_zh) {
        const excerpt = article.excerpt_zh ?? article.content_zh?.slice(0, 300) ?? ''
        content_zh = `${excerpt}\n\n[阅读全文](${articleUrl})`
      }
      if (!content_en) {
        const excerpt = article.excerpt_en ?? article.content_en?.slice(0, 300) ?? ''
        content_en = `${excerpt}\n\n[Read more](${articleUrl})`
      }
    }

    // Validate required fields
    if ((!subject_zh && !subject_en) || (!content_zh && !content_en)) {
      return NextResponse.json(
        { error: 'At least one language (zh or en) must have both subject and content' },
        { status: 400 }
      )
    }

    // Fetch confirmed subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('email_subscribers')
      .select('email, language_preference')
      .eq('confirmed', true)

    if (subError) {
      console.error('Failed to fetch subscribers:', subError)
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 })
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: 'No confirmed subscribers', sent: 0 }, { status: 200 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://johngai.com'

    // Check for Resend API key
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey || resendApiKey === 're_xxx' || resendApiKey.trim() === '') {
      console.warn(
        '[Newsletter] RESEND_API_KEY not configured — mock mode. Would send to',
        subscribers.length,
        'subscribers.'
      )
      return NextResponse.json({
        message: 'Mock send (RESEND_API_KEY not configured)',
        sent: subscribers.length,
        mock: true,
      })
    }

    const resend = new Resend(resendApiKey)
    const fromAddress = `johngai.com <newsletter@johngai.com>`

    // Group subscribers by which email they should receive
    const zhRecipients: string[] = []
    const enRecipients: string[] = []
    const bothRecipients: string[] = []

    for (const sub of subscribers) {
      const lang = sub.language_preference ?? 'both'
      if (lang === 'zh') zhRecipients.push(sub.email)
      else if (lang === 'en') enRecipients.push(sub.email)
      else bothRecipients.push(sub.email)
    }

    const sendResults: { success: number; failed: number } = { success: 0, failed: 0 }

    // Helper: send batch of emails for a specific language
    async function sendBatch(
      emails: string[],
      subject: string,
      htmlContent: string,
      lang: 'zh' | 'en'
    ) {
      if (emails.length === 0) return

      // Resend batch API accepts up to 100 emails per call
      const BATCH_SIZE = 100
      for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        const batch = emails.slice(i, i + BATCH_SIZE)
        const batchPayload = batch.map((email) => ({
          from: fromAddress,
          to: [email],
          subject,
          html: buildEmailHtml({ subject, content: htmlContent, email, siteUrl, lang }),
          headers: {
            'List-Unsubscribe': `<${siteUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${generateUnsubscribeToken(email)}>`,
          },
        }))

        try {
          const result = await resend.batch.send(batchPayload)
          const successCount = result.data?.data?.length ?? batchPayload.length
          sendResults.success += successCount
        } catch (err) {
          console.error(`[Newsletter] Batch send error (lang=${lang}, offset=${i}):`, err)
          sendResults.failed += batch.length
        }
      }
    }

    // Send Chinese emails
    if (subject_zh && content_zh) {
      const zhAll = [...zhRecipients, ...bothRecipients]
      await sendBatch(zhAll, subject_zh, content_zh, 'zh')
    }

    // Send English emails
    if (subject_en && content_en) {
      const enAll = [...enRecipients, ...bothRecipients]
      await sendBatch(enAll, subject_en, content_en, 'en')
    }

    return NextResponse.json({
      message: 'Newsletter sent',
      sent: sendResults.success,
      failed: sendResults.failed,
    })
  } catch (err) {
    console.error('[Newsletter] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
