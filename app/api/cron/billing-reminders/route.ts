import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { SITE_URL } from '@/lib/constants/site'

export const maxDuration = 60

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

  // Find paid subscriptions approaching any 30-day renewal cycle.
  // A sub renews when (days_since_created % 30) falls within a 2-day window.
  type PaidSub = { id: string; user_id: string; tool_id: string; monthly_cost: number; created_at: string; tools: { name: string; slug: string } }
  const { data: allPaidSubs } = await supabase
    .from('user_subscriptions')
    .select('id, user_id, tool_id, monthly_cost, created_at, tools:tool_id(name, slug)')
    .gt('monthly_cost', 0) as { data: PaidSub[] | null }

  if (!allPaidSubs || allPaidSubs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no paid subs' })
  }

  const now = Date.now()
  const subs = allPaidSubs.filter((sub: { created_at: string }) => {
    const daysSince = Math.floor((now - new Date(sub.created_at).getTime()) / 86400000)
    if (daysSince < 28) return false // too new
    const daysUntilRenewal = 30 - (daysSince % 30)
    return daysUntilRenewal >= 0 && daysUntilRenewal <= 2
  })

  if (subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no renewals due' })
  }

  // Group subs by user
  const byUser = new Map<string, typeof subs>()
  for (const sub of subs) {
    const list = byUser.get(sub.user_id) || []
    list.push(sub)
    byUser.set(sub.user_id, list)
  }

  let sent = 0
  const errors: string[] = []

  for (const [userId, userSubs] of byUser) {
    // Get user email from auth
    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    if (!user?.email) continue

    const totalRenewing = userSubs.reduce((s: number, sub: { monthly_cost: number }) => s + Number(sub.monthly_cost), 0)
    const toolLines = userSubs.map((sub: { tools: { name: string } | null; monthly_cost: number }) =>
      `• ${sub.tools?.name || 'Unknown'} — $${Number(sub.monthly_cost).toFixed(2)}/mo`
    ).join('\n')

    try {
      await resend.emails.send({
        from: 'AIPowerStacks <notifications@aipowerstacks.com>',
        to: user.email,
        subject: `💰 $${totalRenewing.toFixed(0)}/mo in AI renewals coming up`,
        text: `Hey,

Your AI subscriptions are about to renew:

${toolLines}

Total: $${totalRenewing.toFixed(2)}/mo ($${(totalRenewing * 12).toFixed(0)}/yr)

Still using all of these? Review your stack and find savings:
${SITE_URL}/tracker

— AIPowerStacks

Unsubscribe: ${SITE_URL}/settings`,
      })
      sent++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${user.email}: ${msg.slice(0, 100)}`)
    }
  }

  return NextResponse.json({ ok: true, sent, totalUsers: byUser.size, errors: errors.slice(0, 5) })
}
