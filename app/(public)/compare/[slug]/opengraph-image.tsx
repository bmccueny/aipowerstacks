import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'edge'
export const alt = 'AI Tool Comparison'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const FONT_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@700;900&display=swap'

async function loadFont(): Promise<ArrayBuffer | undefined> {
  try {
    const css = await (await fetch(FONT_URL)).text()
    const url = css.match(/src: url\(([^)]+)\)/)?.[1]
    if (!url) return undefined
    return (await fetch(url)).arrayBuffer()
  } catch {
    return undefined
  }
}

function parseVsSlug(slug: string): [string, string] | null {
  const parts = slug.split('-vs-')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  return [parts[0], parts[1]]
}

const PRICING_LABELS: Record<string, string> = {
  free: 'Free',
  freemium: 'Freemium',
  paid: 'Paid',
  trial: 'Free Trial',
  open_source: 'Open Source',
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const parsed = parseVsSlug(slug)

  const fallback = (
    <div
      style={{
        background: '#0a0a0f',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            background: '#d03050',
            borderRadius: 10,
            padding: '7px 8px',
          }}
        >
          <div style={{ width: 22, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.7)' }} />
          <div style={{ width: 15, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.7)' }} />
          <div style={{ width: 10, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.7)' }} />
        </div>
        <div style={{ display: 'flex', fontSize: 40, fontWeight: 900, color: 'white' }}>
          <span style={{ color: '#d03050' }}>AI</span>
          <span>PowerStacks</span>
        </div>
      </div>
    </div>
  )

  if (!parsed) {
    return new ImageResponse(fallback, { ...size })
  }

  const supabase = createAdminClient()

  const [fontData, resA, resB] = await Promise.all([
    loadFont(),
    supabase
      .from('tools')
      .select('name, logo_url, avg_rating, pricing_model, review_count')
      .eq('slug', parsed[0])
      .eq('status', 'published')
      .single(),
    supabase
      .from('tools')
      .select('name, logo_url, avg_rating, pricing_model, review_count')
      .eq('slug', parsed[1])
      .eq('status', 'published')
      .single(),
  ])

  const toolA = resA.data
  const toolB = resB.data

  if (!toolA || !toolB) {
    return new ImageResponse(fallback, { ...size })
  }

  type ToolLogo = { name: string; logo_url: string | null; avg_rating: number; pricing_model: string; review_count: number }

  function renderStars(rating: number) {
    const full = Math.floor(rating)
    return Array.from({ length: 5 }).map((_, i) => (
      <span
        key={i}
        style={{
          fontSize: 22,
          color: i < full ? '#fbbf24' : 'rgba(255,255,255,0.15)',
        }}
      >
        ★
      </span>
    ))
  }

  function ToolCard({ tool }: { tool: ToolLogo }) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          flex: 1,
          padding: '32px 40px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 22,
            background: '#1a1820',
            border: '2px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            fontSize: 44,
            fontWeight: 900,
            color: '#d03050',
            flexShrink: 0,
          }}
        >
          {tool.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tool.logo_url}
              alt={tool.name}
              width={100}
              height={100}
              style={{ objectFit: 'contain' }}
            />
          ) : (
            tool.name[0].toUpperCase()
          )}
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: tool.name.length > 14 ? 32 : 40,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: 'white',
            textAlign: 'center',
          }}
        >
          {tool.name}
        </div>

        {/* Stars + rating */}
        {tool.avg_rating > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {renderStars(tool.avg_rating)}
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>
              {tool.avg_rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Pricing badge */}
        <div
          style={{
            display: 'flex',
            fontSize: 16,
            fontWeight: 700,
            background: tool.pricing_model === 'free' ? 'rgba(6,95,70,0.5)' : 'rgba(208,48,80,0.15)',
            border: tool.pricing_model === 'free' ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(208,48,80,0.3)',
            color: tool.pricing_model === 'free' ? '#34d399' : '#f87171',
            borderRadius: 999,
            padding: '6px 18px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {PRICING_LABELS[tool.pricing_model] ?? tool.pricing_model}
        </div>
      </div>
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(140deg, #0a0a0f 0%, #12101a 55%, #0a0a0f 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '44px 56px 40px',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #d03050 0%, #f05070 50%, #d03050 100%)',
            display: 'flex',
          }}
        />

        {/* Subtle grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(208,48,80,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(208,48,80,0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            display: 'flex',
          }}
        />

        {/* Branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                background: '#d03050',
                borderRadius: 8,
                padding: '6px 7px',
              }}
            >
              <div style={{ width: 20, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.7)' }} />
              <div style={{ width: 14, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.7)' }} />
              <div style={{ width: 9, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.7)' }} />
            </div>
            <div style={{ display: 'flex', fontSize: 22, fontWeight: 700 }}>
              <span style={{ color: '#d03050' }}>AI</span>
              <span style={{ color: 'white' }}>PowerStacks</span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(208,48,80,0.1)',
              border: '1px solid rgba(208,48,80,0.25)',
              borderRadius: 999,
              padding: '8px 20px',
              fontSize: 18,
              fontWeight: 700,
              color: '#d03050',
            }}
          >
            Side-by-Side Comparison
          </div>
        </div>

        {/* Tool cards + VS */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            position: 'relative',
            flex: 1,
            paddingTop: 24,
            paddingBottom: 16,
          }}
        >
          <ToolCard tool={toolA as ToolLogo} />

          {/* VS badge */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #d03050 0%, #f05070 100%)',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 900,
                color: 'white',
                letterSpacing: '-0.01em',
                boxShadow: '0 0 32px rgba(208,48,80,0.4)',
              }}
            >
              VS
            </div>
          </div>

          <ToolCard tool={toolB as ToolLogo} />
        </div>

        {/* Bottom domain pill */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 999,
              padding: '8px 24px',
              fontSize: 18,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.02em',
            }}
          >
            aipowerstacks.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      ...(fontData && {
        fonts: [{ name: 'Inter', data: fontData, style: 'normal' as const, weight: 700 as const }],
      }),
    }
  )
}
