import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { SITE_URL } from '@/lib/constants/site'

export const maxDuration = 120

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const resendKey = process.env.RESEND_API_KEY

  // Get all subscriptions grouped by user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allSubs } = await (supabase as any)
    .from('user_subscriptions')
    .select('user_id, tool_id, monthly_cost, tools:tool_id(name)')

  if (!allSubs || allSubs.length === 0) {
    return NextResponse.json({ ok: true, snapshots: 0 })
  }

  const byUser = new Map<string, Array<{ tool_id: string; monthly_cost: number; name: string }>>()
  for (const sub of allSubs) {
    const list = byUser.get(sub.user_id) || []
    list.push({ tool_id: sub.tool_id, monthly_cost: Number(sub.monthly_cost), name: sub.tools?.name || '?' })
    byUser.set(sub.user_id, list)
  }

  const snapshotDate = new Date().toISOString().split('T')[0]
  let snapshots = 0
  let emailsSent = 0

  // Get last month's snapshots for comparison
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prevSnapshots } = await (supabase as any)
    .from('stack_snapshots')
    .select('user_id, total_monthly, tool_count, stack_score')
    .eq('snapshot_date', lastMonthStr)

  const prevByUser = new Map<string, { total_monthly: number; tool_count: number; stack_score: number }>()
  for (const s of prevSnapshots ?? []) {
    prevByUser.set(s.user_id, s)
  }

  const resend = resendKey ? new Resend(resendKey) : null

  for (const [userId, userSubs] of byUser) {
    if (userSubs.length < 1) continue

    const totalMonthly = Math.round(userSubs.reduce((s, sub) => s + sub.monthly_cost, 0))
    const toolCount = userSubs.length
    const toolsJson = userSubs.map(s => ({ tool_id: s.tool_id, cost: s.monthly_cost }))

    // Save snapshot
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('stack_snapshots')
      .upsert({
        user_id: userId,
        snapshot_date: snapshotDate,
        total_monthly: totalMonthly,
        tool_count: toolCount,
        stack_score: 0, // Calculated separately by dashboard
        tools_json: toolsJson,
      }, { onConflict: 'user_id,snapshot_date' })

    snapshots++

    // Send monthly report card email
    if (!resend) continue
    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    if (!user?.email) continue

    const prev = prevByUser.get(userId)
    const spendDelta = prev ? totalMonthly - prev.total_monthly : 0
    const toolDelta = prev ? toolCount - prev.tool_count : 0
    const deltaColor = spendDelta > 0 ? '#ef4444' : spendDelta < 0 ? '#22c55e' : '#666'
    const deltaSign = spendDelta > 0 ? '+' : ''
    const deltaText = prev
      ? `${deltaSign}$${spendDelta}/mo vs last month (${deltaSign}${toolDelta} tools)`
      : 'First snapshot — we\'ll compare next month'

    try {
      await resend.emails.send({
        from: 'AIPowerStacks <notifications@aipowerstacks.com>',
        to: user.email,
        subject: `Your AI Stack: $${totalMonthly}/mo across ${toolCount} tools`,
        html: `
          <div style="max-width:500px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
            <div style="padding:20px 0;border-bottom:2px solid #000">
              <strong style="font-size:16px">AIPowerStacks</strong>
              <span style="color:#666;margin-left:8px;font-size:13px">Monthly Report Card</span>
            </div>
            <div style="padding:24px 0">
              <div style="text-align:center;padding:24px;border:1px solid #eee;border-radius:12px;margin-bottom:16px">
                <p style="font-size:36px;font-weight:900;margin:0">$${totalMonthly}</p>
                <p style="color:#666;font-size:13px;margin:4px 0 0">/month · ${toolCount} tools · $${totalMonthly * 12}/yr</p>
                <p style="color:${deltaColor};font-size:13px;font-weight:600;margin:8px 0 0">${deltaText}</p>
              </div>
              <div style="text-align:center">
                <a href="${SITE_URL}/tracker" style="display:inline-block;padding:12px 28px;background:#000;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
                  Review Your Stack →
                </a>
              </div>
            </div>
            <div style="padding:12px 0;border-top:1px solid #eee;font-size:11px;color:#999">
              <a href="${SITE_URL}/settings" style="color:#999">Unsubscribe</a>
            </div>
          </div>`,
      })
      emailsSent++
    } catch { /* continue */ }
  }

  return NextResponse.json({ ok: true, snapshots, emailsSent })
}
