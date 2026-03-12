import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'

export const alt = 'AI Stack Result'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image(props: {
  searchParams?: Promise<{ tools?: string; q?: string }>
}) {
  const resolved = props.searchParams ? await props.searchParams : {}
  const { tools: toolSlugs, q } = resolved

  let toolNames: string[] = []
  if (toolSlugs) {
    const slugs = toolSlugs.split(',').slice(0, 6)
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('tools')
      .select('name')
      .in('slug', slugs)
      .eq('status', 'published')
    toolNames = (data ?? []).map(t => t.name)
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              fontSize: '20px',
              color: '#e8457c',
              fontWeight: 900,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
            }}
          >
            AIPowerStacks Matchmaker
          </div>
        </div>

        <div
          style={{
            fontSize: '48px',
            fontWeight: 900,
            color: '#ffffff',
            textAlign: 'center' as const,
            lineHeight: 1.2,
            marginBottom: '32px',
            maxWidth: '900px',
          }}
        >
          {q ? `AI Stack for "${q}"` : `${toolNames.length} Tools Matched`}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap' as const,
            justifyContent: 'center',
            maxWidth: '900px',
          }}
        >
          {toolNames.slice(0, 5).map((name, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '12px 24px',
                color: '#ffffff',
                fontSize: '22px',
                fontWeight: 700,
              }}
            >
              {name}
            </div>
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '16px',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          aipowerstacks.com/matchmaker
        </div>
      </div>
    ),
    { ...size }
  )
}
