import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function untypedFrom(supabase: any, table: string) { return supabase.from(table) }

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: rawSubs } = await untypedFrom(supabase, 'user_subscriptions')
    .select('monthly_cost, tools:tool_id(name, logo_url, category_id, use_case)')
    .eq('user_id', user.id)

  type Sub = { monthly_cost: number; tools: { name: string; logo_url: string | null; category_id: string | null; use_case: string | null } }
  const subs = (rawSubs || []) as Sub[]

  const totalMonthly = subs.reduce((s, sub) => s + Number(sub.monthly_cost), 0)
  const totalYearly = Math.round(totalMonthly * 12)
  const toolCount = subs.length

  // Count overlaps — group by category + use_case
  const catGroups = new Map<string, number>()
  for (const sub of subs) {
    const catId = sub.tools?.category_id
    if (!catId) continue
    const useCase = sub.tools?.use_case || 'general'
    const groupKey = `${catId}::${useCase}`
    catGroups.set(groupKey, (catGroups.get(groupKey) || 0) + 1)
  }
  const overlapCount = Array.from(catGroups.values()).filter(c => c >= 2).length

  // Potential savings
  const overlapSavings = Array.from(catGroups.entries()).reduce((total, [, count]) => {
    if (count < 2) return total
    // Rough: assume keeping cheapest, could save (count-1) * avg cost
    return total + (count - 1) * 15 * 12 // conservative $15/mo avg
  }, 0)

  // Load font
  const fontData = await fetch('https://fonts.googleapis.com/css2?family=Inter:wght@700;900&display=swap')
    .then(() => fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff'))
    .then(r => r.arrayBuffer())

  const toolNames = subs.slice(0, 6).map(s => s.tools?.name || '?')

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%)',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px',
          fontFamily: 'Inter',
          color: 'white',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', background: '#dc2626', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900 }}>
              A
            </div>
            <span style={{ fontSize: '20px', fontWeight: 700, opacity: 0.7 }}>AIPowerStacks</span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '3px' }}>
            Savings Report
          </span>
        </div>

        {/* Main stats */}
        <div style={{ display: 'flex', gap: '40px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '64px', fontWeight: 900, lineHeight: 1 }}>${Math.round(totalMonthly)}</span>
            <span style={{ fontSize: '18px', opacity: 0.5, marginTop: '4px' }}>per month</span>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '64px', fontWeight: 900, lineHeight: 1 }}>${totalYearly}</span>
            <span style={{ fontSize: '18px', opacity: 0.5, marginTop: '4px' }}>per year</span>
          </div>
        </div>

        {/* Tool pills */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '40px' }}>
          {toolNames.map((name, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '8px 16px',
                fontSize: '15px',
                fontWeight: 700,
              }}
            >
              {name}
            </div>
          ))}
          {subs.length > 6 && (
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '8px 16px', fontSize: '15px', fontWeight: 700, opacity: 0.5 }}>
              +{subs.length - 6} more
            </div>
          )}
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', gap: '40px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '36px', fontWeight: 900, color: toolCount > 0 ? 'white' : '#888' }}>{toolCount}</span>
            <span style={{ fontSize: '14px', opacity: 0.4 }}>tools tracked</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '36px', fontWeight: 900, color: overlapCount > 0 ? '#f59e0b' : '#22c55e' }}>{overlapCount}</span>
            <span style={{ fontSize: '14px', opacity: 0.4 }}>overlaps found</span>
          </div>
          {overlapSavings > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '36px', fontWeight: 900, color: '#22c55e' }}>${overlapSavings}</span>
              <span style={{ fontSize: '14px', opacity: 0.4 }}>potential savings/yr</span>
            </div>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '16px', opacity: 0.3 }}>aipowerstacks.com/tracker</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Inter', data: fontData, weight: 700, style: 'normal' }],
    }
  )
}
