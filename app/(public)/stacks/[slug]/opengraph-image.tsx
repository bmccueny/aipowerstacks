import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'edge'
export const alt = 'AI Power Stack'
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

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()

  const [fontData, collectionResult] = await Promise.all([
    loadFont(),
    supabase
      .from('collections')
      .select('id, name, description, view_count, save_count, icon, profiles:user_id (username, display_name)')
      .eq('share_slug', slug)
      .single(),
  ])

  const collection = collectionResult.data

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

  if (!collection) {
    return new ImageResponse(fallback, { ...size })
  }

  const { data: items } = await supabase
    .from('collection_items')
    .select('tools:tool_id (name, logo_url)')
    .eq('collection_id', collection.id)
    .order('sort_order', { ascending: true })
    .limit(4)

  type ToolRow = { name: string; logo_url: string | null }
  const tools = (items ?? [])
    .map((i) => i.tools as unknown as ToolRow)
    .filter((t): t is ToolRow => t != null && typeof t.name === 'string')

  // Supabase join returns array or object depending on cardinality — handle both
  const profileRaw = collection.profiles as unknown
  const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw
  const creator = profile as { username: string | null; display_name: string | null } | null

  const creatorLabel =
    creator?.username
      ? `@${creator.username}`
      : creator?.display_name
      ? creator.display_name
      : null

  const stackName = collection.name
  const fontSize = stackName.length > 36 ? 60 : stackName.length > 24 ? 70 : 82

  const viewCount = collection.view_count ?? 0
  const toolCount = tools.length

  const formatCount = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

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
          padding: '52px 60px 48px',
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

        {/* Subtle grid overlay */}
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

        {/* Header row: branding + creator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          {/* Logo mark */}
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

          {/* Creator pill */}
          {creatorLabel && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 999,
                padding: '8px 18px',
                fontSize: 20,
                color: '#aaa',
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(208,48,80,0.25)',
                  border: '1px solid rgba(208,48,80,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 900,
                  color: '#d03050',
                }}
              >
                {(creator?.display_name || creator?.username || 'A')[0].toUpperCase()}
              </div>
              {creatorLabel}
            </div>
          )}
        </div>

        {/* Stack name — center stage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
          <div
            style={{
              fontSize,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              color: 'white',
            }}
          >
            {stackName}
          </div>
          {collection.description && (
            <div
              style={{
                fontSize: 26,
                color: '#777',
                lineHeight: 1.4,
                maxWidth: 820,
              }}
            >
              {collection.description.length > 110
                ? collection.description.slice(0, 110) + '\u2026'
                : collection.description}
            </div>
          )}
        </div>

        {/* Bottom row: tool logos + stats */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          {/* Tool logos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {tools.map((tool, i) => (
              <div
                key={i}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  background: '#1a1820',
                  border: '2px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  fontSize: 28,
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
                    width={72}
                    height={72}
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  tool.name[0].toUpperCase()
                )}
              </div>
            ))}

            {toolCount > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: 'white' }}>
                  {toolCount}
                </span>
                <span style={{ fontSize: 16, color: '#666', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {toolCount === 1 ? 'Tool' : 'Tools'}
                </span>
              </div>
            )}
          </div>

          {/* Stats: views */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {viewCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(208,48,80,0.08)',
                  border: '1px solid rgba(208,48,80,0.2)',
                  borderRadius: 14,
                  padding: '12px 24px',
                  minWidth: 100,
                }}
              >
                <span style={{ fontSize: 32, fontWeight: 900, color: 'white' }}>
                  {formatCount(viewCount)}
                </span>
                <span style={{ fontSize: 14, color: '#666', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Views
                </span>
              </div>
            )}

            {/* aipowerstacks.com pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(208,48,80,0.1)',
                border: '1px solid rgba(208,48,80,0.25)',
                borderRadius: 999,
                padding: '12px 28px',
                fontSize: 20,
                fontWeight: 700,
                color: '#d03050',
                letterSpacing: '0.01em',
              }}
            >
              aipowerstacks.com
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      ...(fontData && {
        fonts: [
          { name: 'Inter', data: fontData, style: 'normal' as const, weight: 700 as const },
        ],
      }),
    }
  )
}
