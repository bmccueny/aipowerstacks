import { ImageResponse } from 'next/og'
import { getToolBySlug } from '@/lib/supabase/queries/tools'

export const alt = 'AI Tool Preview'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

// Load Inter font from Google Fonts for Satori (no system fonts on Vercel)
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
            background: 'black',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          AIPowerStacks
        </div>
      ),
      { ...size }
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #111, #000)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          color: 'white',
          border: '20px solid #222',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          {tool.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tool.logo_url}
              alt={tool.name}
              width="120"
              height="120"
              style={{ borderRadius: '24px', objectFit: 'cover' }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: 72, fontWeight: 'bold', letterSpacing: '-0.03em' }}>
              {tool.name}
            </div>
            {tool.categories && (
              <div
                style={{
                  fontSize: 32,
                  color: '#aaa',
                  background: '#222',
                  padding: '8px 24px',
                  borderRadius: '999px',
                  alignSelf: 'flex-start',
                }}
              >
                {tool.categories.name}
              </div>
            )}
          </div>
        </div>

        <div style={{ fontSize: 36, color: '#ccc', textAlign: 'center', maxWidth: '80%', lineHeight: 1.4 }}>
          {tool.tagline}
        </div>

        <div
          style={{
            marginTop: '60px',
            display: 'flex',
            gap: '40px',
            alignItems: 'center',
          }}
        >
          {tool.review_count > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: 48, color: '#fbbf24' }}>★</div>
              <div style={{ fontSize: 48, fontWeight: 'bold' }}>{tool.avg_rating.toFixed(1)}</div>
            </div>
          )}
          <div style={{ fontSize: 24, color: '#666' }}>AIPowerStacks Directory</div>
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
