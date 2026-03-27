import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function untypedFrom(supabase: any, table: string) { return supabase.from(table) }

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: rawSubs } = await untypedFrom(supabase, 'user_subscriptions')
    .select('monthly_cost, tools:tool_id(name, use_case, category_id)')
    .eq('user_id', user.id)
    .order('monthly_cost', { ascending: false })

  type Sub = { monthly_cost: number; tools: { name: string; use_case: string | null; category_id: string | null } }
  const subs = (rawSubs || []) as Sub[]

  const totalMonthly = subs.reduce((s, sub) => s + Number(sub.monthly_cost), 0)
  const totalYearly = Math.round(totalMonthly * 12)

  // Count overlaps
  const catGroups = new Map<string, Sub[]>()
  for (const sub of subs) {
    const catId = sub.tools?.category_id
    if (!catId) continue
    const list = catGroups.get(catId) || []
    list.push(sub)
    catGroups.set(catId, list)
  }

  const overlaps = Array.from(catGroups.entries())
    .filter(([, items]) => items.length >= 2)
    .map(([, items]) => ({
      tools: items.map(s => ({ name: s.tools.name, cost: Number(s.monthly_cost) })),
      totalCost: items.reduce((s, i) => s + Number(i.monthly_cost), 0),
    }))

  const overlapSavings = overlaps.reduce((s, o) => {
    const cheapest = Math.min(...o.tools.map(t => t.cost))
    return s + (o.totalCost - cheapest) * 12
  }, 0)

  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // Build HTML for PDF
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; padding: 48px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0; }
  .brand { font-size: 20px; font-weight: 900; }
  .brand span { color: #dc2626; }
  .date { color: #888; font-size: 13px; }
  h1 { font-size: 28px; font-weight: 900; margin-bottom: 8px; }
  .subtitle { color: #666; font-size: 15px; margin-bottom: 32px; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat { background: #f8f8f8; border-radius: 12px; padding: 20px; text-align: center; }
  .stat-value { font-size: 32px; font-weight: 900; }
  .stat-label { font-size: 12px; color: #888; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
  .stat-green .stat-value { color: #16a34a; }
  .stat-amber .stat-value { color: #d97706; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; padding: 8px 12px; border-bottom: 2px solid #eee; }
  td { padding: 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  td:last-child { text-align: right; font-weight: 700; }
  .total-row td { border-top: 2px solid #1a1a1a; font-weight: 900; font-size: 16px; }
  .section { margin-bottom: 32px; }
  .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #dc2626; margin-bottom: 12px; }
  .overlap-card { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; font-size: 13px; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #f0f0f0; text-align: center; color: #aaa; font-size: 12px; }
</style>
</head>
<body>
  <div class="header">
    <div class="brand"><span>AI</span>PowerStacks</div>
    <div class="date">${date}</div>
  </div>

  <h1>AI Spend Report</h1>
  <p class="subtitle">Your AI subscription breakdown and savings opportunities.</p>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">$${Math.round(totalMonthly)}</div>
      <div class="stat-label">Monthly spend</div>
    </div>
    <div class="stat">
      <div class="stat-value">$${totalYearly}</div>
      <div class="stat-label">Annual spend</div>
    </div>
    <div class="stat ${overlapSavings > 0 ? 'stat-green' : ''}">
      <div class="stat-value">${overlapSavings > 0 ? `$${overlapSavings}` : '$0'}</div>
      <div class="stat-label">Potential savings/yr</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Subscriptions</div>
    <table>
      <tr><th>Tool</th><th style="text-align:right">Monthly Cost</th></tr>
      ${subs.map(s => `<tr><td>${s.tools.name}</td><td>$${Number(s.monthly_cost).toFixed(2)}</td></tr>`).join('')}
      <tr class="total-row"><td>Total</td><td>$${totalMonthly.toFixed(2)}/mo</td></tr>
    </table>
  </div>

  ${overlaps.length > 0 ? `
  <div class="section">
    <div class="section-title">Overlap Detected</div>
    ${overlaps.map(o => `
      <div class="overlap-card">
        <strong>${o.tools.map(t => t.name).join(', ')}</strong> — $${o.totalCost}/mo on tools that do the same job.
        Keep one, save $${Math.round((o.totalCost - Math.min(...o.tools.map(t => t.cost))) * 12)}/yr.
      </div>
    `).join('')}
  </div>
  ` : `
  <div class="section">
    <div class="section-title">Overlap Check</div>
    <p style="color:#16a34a;font-size:14px;">✓ No overlap detected. Each tool serves a different purpose.</p>
  </div>
  `}

  <div class="footer">
    Generated by AIPowerStacks · aipowerstacks.com/tracker
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': 'attachment; filename="ai-spend-report.html"',
    },
  })
}
