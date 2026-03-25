import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const alt = 'Compare AI Tools'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function loadFont(): Promise<ArrayBuffer | undefined> {
  try {
    const css = await (await fetch('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap')).text()
    const url = css.match(/src: url\(([^)]+)\)/)?.[1]
    if (!url) return undefined
    return (await fetch(url)).arrayBuffer()
  } catch { return undefined }
}

export default async function Image({ searchParams }: { searchParams: Promise<{ tools?: string }> }) {
  const { tools: toolsParam } = await searchParams
  const slugs = (toolsParam ?? '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 4)

  const fontData = await loadFont()

  // No tools selected
  if (slugs.length === 0) {
    return new ImageResponse(
      (
        <div style={{ background: 'linear-gradient(135deg, #0f0f14, #1a1520)', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: 'white' }}>
          <div style={{ fontSize: 28, color: '#c4956a', fontWeight: 700, letterSpacing: '0.15em', marginBottom: 20 }}>AIPOWERSTACKS</div>
          <div style={{ fontSize: 56, fontWeight: 900, marginBottom: 16 }}>Compare AI Tools</div>
          <div style={{ fontSize: 22, color: '#999', maxWidth: 600, textAlign: 'center' }}>Side-by-side comparison of features, pricing, and capabilities</div>
        </div>
      ),
      { ...size, ...(fontData && { fonts: [{ name: 'Inter', data: fontData, style: 'normal' as const, weight: 700 as const }] }) }
    )
  }

  // Fetch tool data
  const supabase = await createClient()
  const { data: tools } = await supabase
    .from('tools')
    .select('name, logo_url, avg_rating, pricing_model, slug')
    .in('slug', slugs)

  const toolList = tools ?? []

  return new ImageResponse(
    (
      <div style={{ background: 'linear-gradient(135deg, #0f0f14, #1a1520)', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', color: 'white', padding: 60 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div style={{ fontSize: 20, color: '#c4956a', fontWeight: 700, letterSpacing: '0.15em' }}>AIPOWERSTACKS</div>
          <div style={{ fontSize: 16, color: '#666', fontWeight: 400 }}>AI Tool Comparison</div>
        </div>

        {/* VS Title */}
        <div style={{ fontSize: 42, fontWeight: 900, marginBottom: 50, letterSpacing: '-0.02em' }}>
          {toolList.map((t, i) => (
            <span key={t.slug}>
              {i > 0 && <span style={{ color: '#c4956a', margin: '0 16px' }}>vs</span>}
              <span>{t.name}</span>
            </span>
          ))}
        </div>

        {/* Tool cards */}
        <div style={{ display: 'flex', gap: 24, flex: 1, alignItems: 'center' }}>
          {toolList.map((tool, i) => (
            <div
              key={tool.slug}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: '32px 24px',
                gap: 16,
              }}
            >
              {/* Logo */}
              {tool.logo_url && (
                <img
                  src={tool.logo_url}
                  width={64}
                  height={64}
                  style={{ borderRadius: 16, objectFit: 'cover' }}
                />
              )}

              {/* Name */}
              <div style={{ fontSize: 22, fontWeight: 700, textAlign: 'center' }}>{tool.name}</div>

              {/* Rating */}
              {tool.avg_rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#fbbf24', fontSize: 20 }}>★</span>
                  <span style={{ fontSize: 20, fontWeight: 700 }}>{tool.avg_rating.toFixed(1)}</span>
                </div>
              )}

              {/* Pricing */}
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '6px 14px',
                borderRadius: 99,
                background: tool.pricing_model === 'free' ? 'rgba(52,211,153,0.15)' : tool.pricing_model === 'freemium' ? 'rgba(56,189,248,0.15)' : 'rgba(251,191,36,0.15)',
                color: tool.pricing_model === 'free' ? '#34d399' : tool.pricing_model === 'freemium' ? '#38bdf8' : '#fbbf24',
              }}>
                {tool.pricing_model}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, ...(fontData && { fonts: [{ name: 'Inter', data: fontData, style: 'normal' as const, weight: 700 as const }] }) }
  )
}
