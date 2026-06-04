import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { fromTable } from '@/lib/supabase/untyped'
import { SITE_URL } from '@/lib/constants/site'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type SubWithTool = {
  user_id: string
  tool_id: string
  monthly_cost: number
  tools: { name: string; slug: string } | null
}

type PriceHistoryRow = {
  tool_id: string
  price: number
  tier_name: string | null
  created_at: string
}

type UserDigest = {
  userId: string
  email: string
  subs: SubWithTool[]
  priceChanges: PriceChange[]
}

type PriceChange = {
  tool_id: string
  tool_name: string
  old_price: number
  new_price: number
  direction: 'increase' | 'decrease'
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })
  }

  const supabase = createAdminClient()
  const resend = new Resend(resendKey)

  // Fetch all subscriptions for users who have 2+ active tools
  const { data: rawSubs } = await supabase
    .from('user_subscriptions')
    .select('user_id, tool_id, monthly_cost, tools:tool_id(name, slug)') as { data: SubWithTool[] | null }

  if (!rawSubs || rawSubs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no subscriptions found' })
  }

  // Group subs by user and filter to those with 2+ tools
  const byUser = new Map<string, SubWithTool[]>()
  for (const sub of rawSubs) {
    const list = byUser.get(sub.user_id) ?? []
    list.push(sub)
    byUser.set(sub.user_id, list)
  }

  const eligibleUsers = [...byUser.entries()].filter(([, subs]) => subs.length >= 2)

  if (eligibleUsers.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no users with 2+ subscriptions' })
  }

  // Fetch price changes from the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const allTrackedToolIds = [...new Set(rawSubs.map(s => s.tool_id))]

  const { data: recentHistory } = await fromTable(supabase, 'tool_price_history')
    .select('tool_id, price, tier_name, created_at')
    .in('tool_id', allTrackedToolIds)
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: false }) as { data: PriceHistoryRow[] | null }

  // For each tool with recent history, resolve the prior price and build a change record
  const resolvedChanges = new Map<string, PriceChange>()

  if (recentHistory && recentHistory.length > 0) {
    const changedToolIds = [...new Set(recentHistory.map(r => r.tool_id))]

    for (const toolId of changedToolIds) {
      const toolRows = recentHistory.filter(r => r.tool_id === toolId)
      const newPrice = toolRows[0].price

      const { data: prev } = await fromTable(supabase, 'tool_price_history')
        .select('price')
        .eq('tool_id', toolId)
        .lt('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(1) as { data: { price: number }[] | null }

      if (!prev || prev.length === 0 || prev[0].price === newPrice) continue

      const { data: tool } = await supabase
        .from('tools')
        .select('name')
        .eq('id', toolId)
        .single()

      if (!tool) continue

      resolvedChanges.set(toolId, {
        tool_id: toolId,
        tool_name: tool.name,
        old_price: prev[0].price,
        new_price: newPrice,
        direction: newPrice > prev[0].price ? 'increase' : 'decrease',
      })
    }
  }

  // Build per-user digest data
  const digests: UserDigest[] = []

  for (const [userId, subs] of eligibleUsers) {
    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    if (!user?.email) continue

    const userToolIds = new Set(subs.map(s => s.tool_id))
    const priceChanges = [...resolvedChanges.values()].filter(c => userToolIds.has(c.tool_id))

    digests.push({ userId, email: user.email, subs, priceChanges })
  }

  // Send emails
  let sent = 0
  const errors: string[] = []

  for (const digest of digests) {
    const totalMonthly = digest.subs.reduce((sum, s) => sum + Number(s.monthly_cost), 0)
    const toolCount = digest.subs.length

    const subject = `Your AI spend: $${totalMonthly.toFixed(2)}/mo across ${toolCount} tool${toolCount === 1 ? '' : 's'}`

    const toolRows = digest.subs
      .slice()
      .sort((a, b) => Number(b.monthly_cost) - Number(a.monthly_cost))
      .map(s => {
        const hasChange = resolvedChanges.has(s.tool_id)
        const change = hasChange ? resolvedChanges.get(s.tool_id)! : null
        const badge = change
          ? change.direction === 'increase'
            ? ' <span style="background:#7f1d1d;color:#fca5a5;font-size:11px;padding:2px 6px;border-radius:4px;margin-left:6px">PRICE UP</span>'
            : ' <span style="background:#14532d;color:#86efac;font-size:11px;padding:2px 6px;border-radius:4px;margin-left:6px">PRICE DOWN</span>'
          : ''
        return `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e2e;color:#f2f2f7">
              ${s.tools?.name ?? 'Unknown tool'}${badge}
            </td>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e2e;color:#a0a0b8;text-align:right;white-space:nowrap">
              $${Number(s.monthly_cost).toFixed(2)}/mo
            </td>
          </tr>`
      })
      .join('')

    const priceChangeBlock = digest.priceChanges.length > 0
      ? `
        <div style="background:#1a0a1a;border:1px solid #5c2d6b;border-radius:8px;padding:16px;margin:24px 0">
          <p style="margin:0 0 10px;color:#e879f9;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Price changes this week</p>
          ${digest.priceChanges.map(c => {
            const pct = Math.abs(Math.round(((c.new_price - c.old_price) / c.old_price) * 100))
            const arrow = c.direction === 'increase' ? '↑' : '↓'
            const color = c.direction === 'increase' ? '#fca5a5' : '#86efac'
            return `<p style="margin:6px 0;color:#f2f2f7;font-size:14px"><strong>${c.tool_name}</strong>: <span style="color:${color}">${arrow} $${c.old_price.toFixed(2)} → $${c.new_price.toFixed(2)}/mo (${pct}%)</span></p>`
          }).join('')}
        </div>`
      : ''

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">

    <div style="margin-bottom:28px">
      <p style="margin:0 0 4px;font-size:12px;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.08em">Weekly Digest</p>
      <h1 style="margin:0;font-size:26px;font-weight:700;color:#f2f2f7;line-height:1.2">Your AI spend this week</h1>
    </div>

    <div style="display:flex;gap:16px;margin-bottom:28px">
      <div style="flex:1;background:#13131f;border:1px solid #1e1e2e;border-radius:10px;padding:20px;text-align:center">
        <div style="font-size:30px;font-weight:700;color:#a78bfa">$${totalMonthly.toFixed(2)}</div>
        <div style="font-size:12px;color:#6b6b8a;margin-top:4px;text-transform:uppercase;letter-spacing:0.05em">per month</div>
      </div>
      <div style="flex:1;background:#13131f;border:1px solid #1e1e2e;border-radius:10px;padding:20px;text-align:center">
        <div style="font-size:30px;font-weight:700;color:#a78bfa">${toolCount}</div>
        <div style="font-size:12px;color:#6b6b8a;margin-top:4px;text-transform:uppercase;letter-spacing:0.05em">active tool${toolCount === 1 ? '' : 's'}</div>
      </div>
      <div style="flex:1;background:#13131f;border:1px solid #1e1e2e;border-radius:10px;padding:20px;text-align:center">
        <div style="font-size:30px;font-weight:700;color:#a78bfa">$${(totalMonthly * 12).toFixed(0)}</div>
        <div style="font-size:12px;color:#6b6b8a;margin-top:4px;text-transform:uppercase;letter-spacing:0.05em">per year</div>
      </div>
    </div>

    ${priceChangeBlock}

    <div style="background:#13131f;border:1px solid #1e1e2e;border-radius:10px;padding:20px;margin-bottom:28px">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.05em">Your stack</p>
      <table style="width:100%;border-collapse:collapse">
        <tbody>${toolRows}</tbody>
        <tfoot>
          <tr>
            <td style="padding:12px 0 0;color:#f2f2f7;font-weight:600">Total</td>
            <td style="padding:12px 0 0;color:#a78bfa;font-weight:700;text-align:right">$${totalMonthly.toFixed(2)}/mo</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div style="text-align:center;margin-bottom:32px">
      <a href="${SITE_URL}/tracker"
         style="display:inline-block;background:#7c3aed;color:#ffffff;font-weight:600;font-size:15px;padding:13px 28px;border-radius:8px;text-decoration:none">
        View your full tracker →
      </a>
    </div>

    <p style="margin:0;font-size:12px;color:#3d3d5c;text-align:center">
      You're receiving this because you track AI tools on
      <a href="${SITE_URL}" style="color:#6b6b8a;text-decoration:none">AIPowerStacks</a>.
    </p>

  </div>
</body>
</html>`

    try {
      await resend.emails.send({
        from: 'AIPowerStacks <newsletter@aipowerstacks.com>',
        to: digest.email,
        subject,
        html,
      })
      sent++
    } catch (err: unknown) {
      errors.push(`${digest.userId}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    totalEligible: digests.length,
    ...(errors.length > 0 && { errors }),
  })
}
