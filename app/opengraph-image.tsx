import { ImageResponse } from 'next/og'

export const alt = 'AIPowerStacks — Track Your AI Spend & Stop Overpaying'
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
        {/* Logo icon */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 6,
            background: '#d4402b',
            borderRadius: 20,
            padding: '18px 20px',
            marginBottom: 32,
          }}
        >
          <div style={{ width: 64, height: 12, borderRadius: 6, background: 'rgba(0,0,0,0.7)' }} />
          <div style={{ width: 46, height: 12, borderRadius: 6, background: 'rgba(0,0,0,0.7)' }} />
          <div style={{ width: 28, height: 12, borderRadius: 6, background: 'rgba(0,0,0,0.7)' }} />
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <span style={{ color: '#d4402b' }}>AI</span>
          <span>PowerStacks</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: '#a0a0a0',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Track Your AI Spend &amp; Stop Overpaying
        </div>

        {/* Stats */}
        <div
          style={{
            marginTop: 40,
            display: 'flex',
            gap: 20,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: 20,
              background: 'rgba(212, 64, 43, 0.12)',
              padding: '10px 24px',
              borderRadius: 999,
              border: '1px solid rgba(212, 64, 43, 0.25)',
              color: '#e8a090',
            }}
          >
            422+ Tools
          </div>
          <div
            style={{
              fontSize: 20,
              background: 'rgba(212, 64, 43, 0.12)',
              padding: '10px 24px',
              borderRadius: 999,
              border: '1px solid rgba(212, 64, 43, 0.25)',
              color: '#e8a090',
            }}
          >
            44+ Categories
          </div>
          <div
            style={{
              fontSize: 20,
              background: 'rgba(212, 64, 43, 0.12)',
              padding: '10px 24px',
              borderRadius: 999,
              border: '1px solid rgba(212, 64, 43, 0.25)',
              color: '#e8a090',
            }}
          >
            Updated Daily
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
