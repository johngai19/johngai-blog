import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const CATEGORY_COLORS: Record<string, { bg: string; accent: string }> = {
  engineering: { bg: '#0F172A', accent: '#3B82F6' },
  life: { bg: '#0F2E1C', accent: '#22C55E' },
  books: { bg: '#1E1033', accent: '#A855F7' },
  industry: { bg: '#2D1B00', accent: '#F59E0B' },
  startup: { bg: '#2D0A0A', accent: '#EF4444' },
  writing: { bg: '#1A1400', accent: '#D4830A' },
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || "John's Blog"
  const category = searchParams.get('category') || 'writing'
  const date = searchParams.get('date') || ''

  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.writing

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          background: `linear-gradient(135deg, ${colors.bg} 0%, #1A1A1A 50%, ${colors.bg} 100%)`,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            width: '80px',
            height: '4px',
            backgroundColor: colors.accent,
            borderRadius: '2px',
          }}
        />

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: title.length > 60 ? 36 : title.length > 40 ? 44 : 52,
              fontWeight: 700,
              color: '#FAFAF8',
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
              maxWidth: '90%',
            }}
          >
            {title.slice(0, 80)}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: colors.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              J
            </div>
            <div style={{ color: '#9CA3AF', fontSize: '20px' }}>
              johngai.com
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
            }}
          >
            {category && (
              <div
                style={{
                  color: colors.accent,
                  fontSize: '16px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {category}
              </div>
            )}
            {date && (
              <div style={{ color: '#6B7280', fontSize: '16px' }}>
                {date}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
