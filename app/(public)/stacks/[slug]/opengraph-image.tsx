import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const alt = 'AI Power Stack'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: collection } = await supabase
    .from('collections')
    .select('id, name, description')
    .eq('share_slug', slug)
    .single()

  const fallback = (
    <div style={{ background: 'linear-gradient(to bottom right, #111, #000)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'sans-serif', fontSize: 48 }}>
      AIPowerStacks
    </div>
  )

  if (!collection) return new ImageResponse(fallback, { ...size })

  const { data: items } = await supabase
    .from('collection_items')
    .select('tools:tool_id (name, logo_url)')
    .eq('collection_id', collection.id)
    .limit(6)

  const tools = (items?.map(i => i.tools) ?? []).filter(Boolean) as { name: string; logo_url: string | null }[]

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          fontFamily: 'sans-serif',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Top accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #e879a0, #f43f5e, #e879a0)', display: 'flex' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', background: 'rgba(244,63,94,0.2)', borderRadius: '16px', border: '1px solid rgba(244,63,94,0.3)' }}>
            <div style={{ fontSize: '28px', display: 'flex' }}>⚡</div>
          </div>
          <div style={{ fontSize: '22px', color: '#888', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            AI Power Stack · AIPowerStacks
          </div>
        </div>

        {/* Stack name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: collection.name.length > 30 ? 64 : 80, fontWeight: '900', letterSpacing: '-0.03em', lineHeight: 1.05, color: 'white' }}>
            {collection.name}
          </div>
          {collection.description && (
            <div style={{ fontSize: '28px', color: '#888', lineHeight: 1.4, maxWidth: '800px' }}>
              {collection.description.length > 100 ? collection.description.slice(0, 100) + '…' : collection.description}
            </div>
          )}
        </div>

        {/* Tool logos + count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {tools.slice(0, 6).map((tool, i) => (
              <div
                key={i}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#222',
                  border: '3px solid #111',
                  marginLeft: i === 0 ? '0' : '-16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  fontSize: '22px',
                  fontWeight: '900',
                  color: '#f43f5e',
                  zIndex: String(10 - i),
                }}
              >
                {tool.logo_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={tool.logo_url} alt={tool.name} width={64} height={64} style={{ objectFit: 'cover' }} />
                  : tool.name[0]
                }
              </div>
            ))}
            {tools.length > 0 && (
              <div style={{ marginLeft: '20px', fontSize: '24px', color: '#666', fontWeight: '600' }}>
                {tools.length} tool{tools.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', padding: '12px 24px', borderRadius: '999px' }}>
            <div style={{ fontSize: '22px', color: '#f43f5e', fontWeight: '700', display: 'flex' }}>aipowerstacks.com</div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
