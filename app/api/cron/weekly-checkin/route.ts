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

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

  const supabase = createAdminClient()
  const resend = new Resend(resendKey)

  // Get all users with 2+ paid subscriptions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allSubs } = await (supabase as any)
    .from('user_subscriptions')
    .select('user_id, tool_id, monthly_cost, tools:tool_id(name, logo_url)')
    .gt('monthly_cost', 0)

  if (!allSubs || allSubs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  // Group by user
  const byUser = new Map<string, Array<{ tool_id: string; name: string; logo_url: string | null; cost: number }>>()
  for (const sub of allSubs) {
    const list = byUser.get(sub.user_id) || []
    list.push({ tool_id: sub.tool_id, name: sub.tools?.name || '?', logo_url: sub.tools?.logo_url, cost: Number(sub.monthly_cost) })
    byUser.set(sub.user_id, list)
  }

  let sent = 0

  for (const [userId, userTools] of byUser) {
    if (userTools.length < 2) continue

    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    if (!user?.email) continue

    const checkinUrl = `${SITE_URL}/tracker?checkin=true`
    const toolRows = userTools.map(t =>
      `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0">
          <strong>${t.name}</strong>
          <span style="color:#999;margin-left:8px">$${t.cost}/mo</span>
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;text-align:right">
          <a href="${checkinUrl}" style="display:inline-block;padding:4px 14px;background:#f0f0f0;border-radius:6px;text-decoration:none;color:#333;font-size:13px;font-weight:600">Used it</a>
        </td>
      </tr>`
    ).join('')

    try {
      await resend.emails.send({
        from: 'AIPowerStacks <notifications@aipowerstacks.com>',
        to: user.email,
        subject: `Quick check — which AI tools did you use this week?`,
        html: `
          <div style="max-width:500px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
            <div style="padding:20px 0;border-bottom:2px solid #000">
              <strong style="font-size:16px">AIPowerStacks</strong>
              <span style="color:#666;margin-left:8px;font-size:13px">Weekly Check-In</span>
            </div>
            <div style="padding:20px 0">
              <p style="font-size:15px;margin:0 0 16px">Tap below for each tool you actually used this past week. Takes 10 seconds.</p>
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tbody>${toolRows}</tbody>
              </table>
              <div style="margin-top:20px;text-align:center">
                <a href="${checkinUrl}" style="display:inline-block;padding:12px 28px;background:#000;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
                  Check In Now →
                </a>
              </div>
              <p style="font-size:12px;color:#999;margin-top:16px;text-align:center">
                Over time, this helps us spot tools you're paying for but not using.
              </p>
            </div>
            <div style="padding:12px 0;border-top:1px solid #eee;font-size:11px;color:#999">
              <a href="${SITE_URL}/settings" style="color:#999">Unsubscribe</a>
            </div>
          </div>`,
      })
      sent++
    } catch { /* continue */ }
  }

  return NextResponse.json({ ok: true, sent, totalUsers: byUser.size })
}
