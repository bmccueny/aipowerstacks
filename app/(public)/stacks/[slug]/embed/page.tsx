import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { PRICING_LABELS } from '@/lib/constants'
import { SITE_URL } from '@/lib/constants/site'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// Inline CSS color values for pricing badges (Tailwind classes don't work in standalone embed HTML)
const EMBED_BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  free:     { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  freemium: { bg: '#e0f2fe', color: '#075985', border: '#7dd3fc' },
  paid:     { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  trial:    { bg: '#e0e7ff', color: '#3730a3', border: '#a5b4fc' },
  contact:  { bg: '#f5f5f4', color: '#44403c', border: '#d6d3d1' },
  unknown:  { bg: '#f5f5f4', color: '#44403c', border: '#d6d3d1' },
}

export default async function StackEmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: collection } = await supabase
    .from('collections')
    .select('id, name, description, icon, share_slug')
    .eq('share_slug', slug)
    .eq('is_public', true)
    .single()

  if (!collection) notFound()

  const { data: items } = await supabase
    .from('collection_items')
    .select(`
      note,
      tools:tool_id (id, name, slug, tagline, website_url, logo_url, pricing_model)
    `)
    .eq('collection_id', collection.id)
    .order('sort_order', { ascending: true })
    .limit(10)

  type EmbedToolRow = NonNullable<NonNullable<typeof items>[number]['tools']>
  type EmbedToolWithNote = EmbedToolRow & { _note: string | null }
  const tools: EmbedToolWithNote[] = (items?.map(i => ({ ...(i.tools as EmbedToolRow), _note: i.note })) ?? []).filter((t): t is EmbedToolWithNote => Boolean(t?.id))

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: `
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e5e5e5; }
          .widget { border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; max-width: 480px; }
          .header { background: linear-gradient(135deg, #111 0%, #1a1a1a 100%); padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
          .header-top { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
          .icon { font-size: 24px; }
          .name { font-size: 17px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
          .desc { font-size: 12px; color: #888; line-height: 1.5; }
          .tool { display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); text-decoration: none; color: inherit; transition: background 0.15s; }
          .tool:hover { background: rgba(255,255,255,0.03); }
          .tool:last-child { border-bottom: none; }
          .logo { width: 36px; height: 36px; border-radius: 8px; background: #1e1e1e; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .logo img { width: 36px; height: 36px; object-fit: contain; }
          .logo-initial { font-size: 14px; font-weight: 900; color: #e879a0; }
          .tool-info { flex: 1; min-width: 0; }
          .tool-name { font-size: 13px; font-weight: 700; color: #fff; }
          .tool-tagline { font-size: 11px; color: #666; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .tool-note { font-size: 11px; color: #e879a0; font-style: italic; margin-top: 2px; }
          .badge { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 999px; flex-shrink: 0; }
          .footer { background: #0d0d0d; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.06); }
          .footer-brand { font-size: 11px; color: #555; }
          .footer-link { font-size: 11px; color: #e879a0; text-decoration: none; font-weight: 600; }
          .footer-link:hover { text-decoration: underline; }
        ` }} />
      </head>
      <body>
        <div className="widget">
          <div className="header">
            <div className="header-top">
              <span className="icon">{collection.icon || '⚡'}</span>
              <span className="name">{collection.name}</span>
            </div>
            {collection.description && (
              <p className="desc">{collection.description}</p>
            )}
          </div>

          {tools.map((tool: EmbedToolWithNote) => {
            const badgeStyle = EMBED_BADGE_STYLES[tool.pricing_model] ?? EMBED_BADGE_STYLES.unknown
            const pricingLabel = PRICING_LABELS[tool.pricing_model] ?? 'Unknown'
            return (
              <a
                key={tool.id}
                href={`${SITE_URL}/tools/${tool.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tool"
              >
                <div className="logo">
                  {tool.logo_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={tool.logo_url} alt={tool.name} width={36} height={36} />
                    : <span className="logo-initial">{tool.name[0]}</span>
                  }
                </div>
                <div className="tool-info">
                  <div className="tool-name">{tool.name}</div>
                  <div className="tool-tagline">{tool.tagline}</div>
                  {tool._note && <div className="tool-note">"{tool._note}"</div>}
                </div>
                {badgeStyle && (
                  <span
                    className="badge"
                    style={{
                      backgroundColor: badgeStyle.bg,
                      color: badgeStyle.color,
                      border: `1px solid ${badgeStyle.border}`,
                    }}
                  >
                    {pricingLabel}
                  </span>
                )}
              </a>
            )
          })}

          <div className="footer">
            <span className="footer-brand">AIPowerStacks</span>
            <a
              href={`${SITE_URL}/stacks/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              View full stack →
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
