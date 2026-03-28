import { ImageResponse } from 'next/og'

export const alt = 'AIPowerStacks - Discover the Best AI Tools'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          color: 'white',
          padding: '60px',
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          AIPowerStacks
        </div>
        <div
          style={{
            fontSize: 36,
            color: '#a0a0a0',
            textAlign: 'center',
            maxWidth: '80%',
            lineHeight: 1.4,
          }}
        >
          Discover, compare & track the best AI tools
        </div>
        <div
          style={{
            marginTop: '48px',
            display: 'flex',
            gap: '24px',
            alignItems: 'center',
          }}
        >
          {['🤖 1000+ Tools', '⭐ Expert Reviews', '📊 Price Tracking'].map((item) => (
            <div
              key={item}
              style={{
                fontSize: 22,
                background: 'rgba(255,255,255,0.08)',
                padding: '12px 28px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
