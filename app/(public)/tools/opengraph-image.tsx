import { ImageResponse } from 'next/og'

export const alt = 'AI Tools Directory — AIPowerStacks'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
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
          padding: '60px',
        }}
      >
        {/* Brand logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, background: '#d4402b', borderRadius: 16, padding: '14px 16px' }}>
            <div style={{ width: 48, height: 10, borderRadius: 5, background: 'rgba(0,0,0,0.7)' }} />
            <div style={{ width: 34, height: 10, borderRadius: 5, background: 'rgba(0,0,0,0.7)' }} />
            <div style={{ width: 22, height: 10, borderRadius: 5, background: 'rgba(0,0,0,0.7)' }} />
          </div>
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 700 }}>
            <span style={{ color: '#d4402b' }}>AI</span>
            <span>PowerStacks</span>
          </div>
        </div>

        <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 20 }}>
          AI Tools Directory
        </div>
        <div style={{ fontSize: 30, color: '#a0a0a0', textAlign: 'center', lineHeight: 1.4 }}>
          Browse, filter &amp; compare 422+ AI tools across every category
        </div>
        <div
          style={{
            marginTop: 40,
            display: 'flex',
            gap: 20,
          }}
        >
          <div style={{ fontSize: 20, background: 'rgba(212, 64, 43, 0.12)', padding: '10px 24px', borderRadius: 999, border: '1px solid rgba(212, 64, 43, 0.25)', color: '#e8a090' }}>
            Compare Side-by-Side
          </div>
          <div style={{ fontSize: 20, background: 'rgba(212, 64, 43, 0.12)', padding: '10px 24px', borderRadius: 999, border: '1px solid rgba(212, 64, 43, 0.25)', color: '#e8a090' }}>
            Real User Reviews
          </div>
          <div style={{ fontSize: 20, background: 'rgba(212, 64, 43, 0.12)', padding: '10px 24px', borderRadius: 999, border: '1px solid rgba(212, 64, 43, 0.25)', color: '#e8a090' }}>
            Price Tracking
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
