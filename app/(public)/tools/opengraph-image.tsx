import { ImageResponse } from 'next/og'

export const alt = 'AI Tools Directory - AIPowerStacks'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
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
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            marginBottom: '20px',
          }}
        >
          🔍 AI Tools Directory
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#aaa',
            textAlign: 'center',
            maxWidth: '80%',
            lineHeight: 1.4,
          }}
        >
          Browse, filter & compare 1000+ AI tools across every category
        </div>
        <div
          style={{
            marginTop: '48px',
            fontSize: 22,
            color: '#666',
          }}
        >
          AIPowerStacks.com
        </div>
      </div>
    ),
    { ...size },
  )
}
