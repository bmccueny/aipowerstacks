import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fromTable } from '@/lib/supabase/untyped'
import { Resend } from 'resend'
import { SITE_URL } from '@/lib/constants/site'

export const maxDuration = 60

type PriceRecord = {
  tool_id: string
  price: number
  tier_name: string | null
  created_at: string
}

type SubWithTool = {
  user_id: string
  tool_id: string
  monthly_cost: number
  tools: { name: string; slug: string } | null
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })
  }

  const supabase = createAdminClient()
  const resend = new Resend(resendKey)

  // Find price changes recorded in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: recentChanges } = await fromTable(supabase, 'tool_price_history')
    .select('tool_id, price, tier_name, created_at')
    .gte('created_at', oneDayAgo)
    .order('created_at', { ascending: false }) as { data: PriceRecord[] | null }

  if (!recentChanges || recentChanges.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no price changes' })
  }

  // For each changed tool, get the previous price to compute the delta
  const changedToolIds = [...new Set(recentChanges.map(r => r.tool_id))]

  type ChangeInfo = {
    tool_id: string
    tool_name: string
    tool_slug: string
    old_price: number
    new_price: number
    direction: 'increase' | 'decrease'
  }

  const changes: ChangeInfo[] = []

  for (const toolId of changedToolIds) {
    const toolChanges = recentChanges.filter(r => r.tool_id === toolId)
    const latestPrice = toolChanges[0].price

    // Get the most recent price BEFORE the 24h window
    const { data: prev } = await fromTable(supabase, 'tool_price_history')
      .select('price')
      .eq('tool_id', toolId)
      .lt('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(1) as { data: { price: number }[] | null }

    if (!prev || prev.length === 0) continue
    const oldPrice = prev[0].price
    if (oldPrice === latestPrice) continue

    // Get tool name
    const { data: tool } = await supabase
      .from('tools')
      .select('name, slug')
      .eq('id', toolId)
      .single()

    if (!tool) continue

    changes.push({
      tool_id: toolId,
      tool_name: tool.name,
      tool_slug: tool.slug,
      old_price: oldPrice,
      new_price: latestPrice,
      direction: latestPrice > oldPrice ? 'increase' : 'decrease',
    })
  }

  if (changes.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no meaningful changes' })
  }

  // Find users who track these tools
  const { data: affectedSubs } = await supabase
    .from('user_subscriptions')
    .select('user_id, tool_id, monthly_cost, tools:tool_id(name, slug)')
    .in('tool_id', changes.map(c => c.tool_id)) as { data: SubWithTool[] | null }

  if (!affectedSubs || affectedSubs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no users track changed tools' })
  }

  // Group by user
  const byUser = new Map<string, { sub: SubWithTool; change: ChangeInfo }[]>()
  for (const sub of affectedSubs) {
    const change = changes.find(c => c.tool_id === sub.tool_id)
    if (!change) continue
    const list = byUser.get(sub.user_id) || []
    list.push({ sub, change })
    byUser.set(sub.user_id, list)
  }

  // Get user emails
  let sent = 0
  const errors: string[] = []

  for (const [userId, items] of byUser) {
    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    if (!user?.email) continue

    const increases = items.filter(i => i.change.direction === 'increase')
    const decreases = items.filter(i => i.change.direction === 'decrease')

    const lines: string[] = []

    if (increases.length > 0) {
      lines.push('<h3 style="color:#d03050;margin:16px 0 8px">⬆️ Price Increases</h3>')
      for (const { change } of increases) {
        const pct = Math.round(((change.new_price - change.old_price) / change.old_price) * 100)
        lines.push(`<p style="margin:4px 0"><strong>${change.tool_name}</strong>: $${change.old_price}/mo → $${change.new_price}/mo (+${pct}%) — <a href="${SITE_URL}/ai/${change.tool_slug}">View alternatives</a></p>`)
      }
    }

    if (decreases.length > 0) {
      lines.push('<h3 style="color:#22c55e;margin:16px 0 8px">⬇️ Price Drops</h3>')
      for (const { change } of decreases) {
        const pct = Math.round(((change.old_price - change.new_price) / change.old_price) * 100)
        lines.push(`<p style="margin:4px 0"><strong>${change.tool_name}</strong>: $${change.old_price}/mo → $${change.new_price}/mo (-${pct}%)</p>`)
      }
    }

    const subject = increases.length > 0
      ? `🚨 Price ${increases.length === 1 ? `change for ${increases[0].change.tool_name}` : `changes for ${increases.length} tools`}`
      : `💰 Price drop for ${decreases[0].change.tool_name}`

    try {
      await resend.emails.send({
        from: 'AIPowerStacks <newsletter@aipowerstacks.com>',
        to: user.email,
        subject,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <h2 style="margin:0 0 16px">AI Subscription Price Alert</h2>
            ${lines.join('\n')}
            <hr style="margin:24px 0;border:none;border-top:1px solid #e5e5e5" />
            <p style="margin:0"><a href="${SITE_URL}/tracker" style="color:#d03050;font-weight:600">Review your stack →</a></p>
            <p style="color:#999;font-size:12px;margin:16px 0 0">You're receiving this because you track ${items.length === 1 ? 'this tool' : 'these tools'} on AIPowerStacks.</p>
          </div>
        `,
      })
      sent++
    } catch (err) {
      errors.push(`${userId}: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  return NextResponse.json({ ok: true, sent, totalUsers: byUser.size, changes: changes.length, errors: errors.length > 0 ? errors : undefined })
}
