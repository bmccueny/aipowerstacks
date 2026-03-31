import { ImageResponse } from 'next/og'
import { getToolBySlug } from '@/lib/supabase/queries/tools'

export const alt = 'AI Tool Preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const fontUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap'
async function loadFont(): Promise<ArrayBuffer> {
  const css = await (await fetch(fontUrl)).text()
  const url = css.match(/src: url\(([^)]+)\)/)?.[1]
  if (!url) throw new Error('Font URL not found')
  return (await fetch(url)).arrayBuffer()
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tool = await getToolBySlug(slug)

  let fontData: ArrayBuffer | undefined
  try { fontData = await loadFont() } catch {}

  if (!tool) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: '#1a1410',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <span style={{ color: '#d4402b' }}>AI</span>PowerStacks
        </div>
      ),
      { ...size }
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1410 0%, #231815 50%, #1a1410 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          color: 'white',
          padding: '48px 60px',
          position: 'relative',
        }}
      >
        {/* Top bar — branding */}
        <div style={{ position: 'absolute', top: 36, left: 60, display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Mini logo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, background: '#d4402b', borderRadius: 8, padding: '6px 7px' }}>
            <div style={{ width: 20, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.7)' }} />
            <div style={{ width: 14, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.7)' }} />
            <div style={{ width: 9, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.7)' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            <span style={{ color: '#d4402b' }}>AI</span>PowerStacks
          </div>
        </div>

        {/* Tool content */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 32 }}>
          {tool.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tool.logo_url}
              alt={tool.name}
              width="110"
              height="110"
              style={{ borderRadius: 22, objectFit: 'cover', border: '3px solid rgba(255,255,255,0.1)' }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: '-0.03em' }}>
              {tool.name}
            </div>
            {tool.categories && (
              <div
                style={{
                  fontSize: 26,
                  color: '#e8a090',
                  background: 'rgba(212, 64, 43, 0.15)',
                  padding: '6px 20px',
                  borderRadius: 999,
                  alignSelf: 'flex-start',
                  border: '1px solid rgba(212, 64, 43, 0.25)',
                }}
              >
                {tool.categories.name}
              </div>
            )}
          </div>
        </div>

        <div style={{ fontSize: 32, color: '#ccc', textAlign: 'center', maxWidth: '80%', lineHeight: 1.4 }}>
          {tool.tagline}
        </div>

        <div style={{ marginTop: 48, display: 'flex', gap: 28, alignItems: 'center' }}>
          <div
            style={{
              fontSize: 24,
              background: tool.pricing_model === 'free' ? '#065f46' : 'rgba(212, 64, 43, 0.2)',
              padding: '8px 24px',
              borderRadius: 999,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              border: tool.pricing_model === 'free' ? '1px solid #0d9668' : '1px solid rgba(212, 64, 43, 0.35)',
            }}
          >
            {tool.pricing_model === 'free' ? 'Free' : tool.pricing_model === 'freemium' ? 'Freemium' : tool.pricing_model === 'paid' ? 'Paid' : tool.pricing_model === 'trial' ? 'Free Trial' : tool.pricing_model ?? 'N/A'}
          </div>
          {tool.review_count > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 40, color: '#fbbf24' }}>★</div>
              <div style={{ fontSize: 40, fontWeight: 900 }}>{tool.avg_rating.toFixed(1)}</div>
            </div>
          )}
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
