import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

type Action = 'polish' | 'summarize' | 'translate' | 'suggest_title' | 'categorize'

interface AssistRequest {
  action: Action
  content: string
  title?: string
  lang?: 'zh' | 'en'
}

async function verifyAdmin(request: NextRequest) {
  void request
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

function buildPrompt(action: Action, content: string, title?: string, lang?: string): string {
  switch (action) {
    case 'polish':
      return `You are a skilled bilingual editor. Polish and improve the following text to make it clearer, more engaging, and better written. Preserve the original language and tone. Return only the improved text, no explanations.

Text to polish:
${content}`

    case 'summarize':
      return `You are a skilled bilingual editor. Write a 2-3 sentence excerpt/summary for the following article content. The summary should be in the same language as the article content. Be concise and capture the main point. Return only the summary, no explanations.

Article content:
${content}`

    case 'translate': {
      const fromLang = lang === 'zh' ? 'Chinese' : 'English'
      const toLang = lang === 'zh' ? 'English' : 'Chinese'
      return `You are a skilled literary translator. Translate the following ${fromLang} text to ${toLang}.

Translation guidelines:
- Preserve the author's voice and tone
- Use natural, fluent ${toLang} rather than literal translation
- Maintain paragraph structure
- For Chinese→English: use clear, accessible English; avoid overly formal register
- For English→Chinese: use standard simplified Chinese; prefer concise expressions
- Return only the translation, no explanations or notes

Text to translate:
${content}`
    }

    case 'suggest_title':
      return `You are a skilled bilingual editor. Based on the following article content, suggest 3 improved titles. ${title ? `The current title is: "${title}"` : ''}

Provide both a Chinese title and an English title for each suggestion, in this exact format:
1. ZH: [Chinese title]
   EN: [English title]
2. ZH: [Chinese title]
   EN: [English title]
3. ZH: [Chinese title]
   EN: [English title]

Article content (first 500 chars):
${content.slice(0, 500)}`

    case 'categorize':
      return `You are a content classification assistant for a bilingual tech/life blog. Analyze the following article and suggest the most appropriate category and up to 5 relevant tags.

Available categories:
- engineering: software, hardware, systems, architecture
- industry: business trends, industry analysis, economics
- books: book reviews, philosophy, ideas, intellectual discourse
- life: personal essays, travel, reflection, daily life
- startup: entrepreneurship, product, management, business building
- writing: creative writing, literature, craft, storytelling

Respond in this exact JSON format:
{
  "category": "<one of the category slugs above>",
  "tags": ["tag1", "tag2", "tag3"],
  "reason": "<one sentence explanation>"
}

Article title: ${title || '(no title)'}
Article content (first 800 chars):
${content.slice(0, 800)}`

    default:
      return content
  }
}

async function callOpenAI(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_completion_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${err}`)
  }

  const data = await response.json()
  return (data.choices?.[0]?.message?.content as string) ?? ''
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: AssistRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { action, content, title, lang } = body

  if (!action || !content) {
    return NextResponse.json({ error: 'action and content are required' }, { status: 400 })
  }

  const validActions: Action[] = ['polish', 'summarize', 'translate', 'suggest_title', 'categorize']
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 })
  }

  const maxTokens = action === 'translate' ? 4000 : 2000

  try {
    const prompt = buildPrompt(action, content, title, lang)
    const result = await callOpenAI(prompt, maxTokens)

    // For categorize action, try to parse JSON from the result
    if (action === 'categorize') {
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return NextResponse.json({ result, parsed })
        }
      } catch {
        // Fall through to return raw result
      }
    }

    return NextResponse.json({ result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
