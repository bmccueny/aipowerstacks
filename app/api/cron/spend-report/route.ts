import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

/* ── Config ──────────────────────────────────────────────────────────────────── */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aipowerstacks.com'
const PRIMARY_COLOR = '#d03050'
const BATCH_SIZE = 50

/* ── Types ───────────────────────────────────────────────────────────────────── */

interface SubRow {
  user_id: string
  tool_id: string
  monthly_cost: number
  billing_cycle: string | null
}

interface ToolRow {
  id: string
  name: string
  slug: string
  logo_url: string | null
  pricing_model: string
  category_id: string
}

interface CategoryRow {
  id: string
  name: string
}

interface EnrichedSub extends SubRow {
  tool: ToolRow | null
  categoryName: string | null
}

interface AltTool extends ToolRow {
  categoryName: string | null
}

interface CostSnapshotRow {
  user_id: string
  month: string
  total_monthly: number
}

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/* ── HTML email template ─────────────────────────────────────────────────────── */

function buildSpendEmailHtml(
  displayName: string | null,
  totalMonthly: number,
  momDelta: number | null,
  subs: EnrichedSub[],
  alts: AltTool[],
  unsubUrl: string,
  monthLabel: string,
): string {
  const greeting = displayName ? `Hi ${displayName.split(' ')[0]}` : 'Hi there'

  const toolRows = subs
    .filter((s): s is EnrichedSub & { tool: ToolRow } => s.tool != null)
    .sort((a, b) => b.monthly_cost - a.monthly_cost)
    .map(
      (s) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
          <table role="presentation" width="100%"><tr>
            <td width="44" style="vertical-align: middle; padding-right: 10px;">
              ${
                s.tool.logo_url
                  ? `<img src="${s.tool.logo_url}" width="32" height="32" style="border-radius: 6px; display: block;" alt="">`
                  : `<div style="width: 32px; height: 32px; background: #1a1a1a; border-radius: 6px;"></div>`
              }
            </td>
            <td style="vertical-align: middle;">
              <a href="${APP_URL}/tools/${s.tool.slug}" style="color: #1a1a1a; font-weight: 600; font-size: 14px; text-decoration: none;">${s.tool.name}</a>
              ${s.billing_cycle && s.billing_cycle !== 'monthly' ? `<div style="color: #888; font-size: 12px; margin-top: 2px;">${s.billing_cycle}</div>` : ''}
            </td>
            <td style="vertical-align: middle; text-align: right; white-space: nowrap;">
              <span style="font-size: 15px; font-weight: 700; color: #1a1a1a;">${formatCurrency(s.monthly_cost)}</span><span style="color: #999; font-size: 11px;">/mo</span>
            </td>
          </tr></table>
        </td>
      </tr>`,
    )
    .join('')

  let momHtml = ''
  if (momDelta !== null && momDelta !== 0) {
    const isUp = momDelta > 0
    const color = isUp ? '#c04040' : '#30a050'
    const arrow = isUp ? '▲' : '▼'
    momHtml = `<div style="margin-top: 8px;"><span style="display: inline-block; background: ${color}1a; color: ${color}; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 4px;">${arrow} ${formatCurrency(Math.abs(momDelta))} vs last month</span></div>`
  }

  const tipsRows = alts
    .slice(0, 2)
    .map(
      (a) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
          <table role="presentation" width="100%"><tr>
            <td width="44" style="vertical-align: middle; padding-right: 10px;">
              ${
                a.logo_url
                  ? `<img src="${a.logo_url}" width="32" height="32" style="border-radius: 6px; display: block;" alt="">`
                  : `<div style="width: 32px; height: 32px; background: #1a1a1a; border-radius: 6px;"></div>`
              }
            </td>
            <td style="vertical-align: middle;">
              <a href="${APP_URL}/tools/${a.slug}" style="color: ${PRIMARY_COLOR}; font-weight: 600; font-size: 14px; text-decoration: none;">${a.name}</a>
              ${a.categoryName ? `<div style="color: #888; font-size: 12px; margin-top: 2px;">${a.categoryName}</div>` : ''}
            </td>
            <td style="vertical-align: middle; text-align: right;">
              <span style="background: #30a0501a; color: #30a050; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 4px;">${a.pricing_model === 'free' ? 'Free' : 'Freemium'}</span>
            </td>
          </tr></table>
        </td>
      </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" style="background: #f5f5f5; padding: 20px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr><td style="background: #0d0d0d; padding: 28px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
            <span style="color: #ffffff;">AI</span><span style="color: ${PRIMARY_COLOR};">PowerStacks</span>
          </h1>
          <div style="color: #888; font-size: 12px; margin-top: 6px; text-transform: uppercase; letter-spacing: 2px;">Monthly Spend Report</div>
        </td></tr>

        <!-- Spend summary -->
        <tr><td style="padding: 30px 30px 20px;">
          <p style="font-size: 15px; color: #555; margin: 0 0 20px 0;">${greeting}, here&rsquo;s your AI tool spend for ${monthLabel}.</p>
          <div style="background: #f9f9f9; border-radius: 10px; padding: 22px 24px; text-align: center; border: 1px solid #efefef;">
            <div style="color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Total Monthly Spend</div>
            <div style="font-size: 38px; font-weight: 900; color: #1a1a1a; letter-spacing: -1px; line-height: 1;">${formatCurrency(totalMonthly)}<span style="font-size: 14px; font-weight: 400; color: #999;">/mo</span></div>
            ${momHtml}
          </div>
        </td></tr>

        <!-- Tool list -->
        <tr><td style="padding: 0 30px 10px;">
          <h2 style="font-size: 11px; font-weight: 800; color: #aaa; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1.5px;">Your Stack</h2>
          <table role="presentation" width="100%">${toolRows}</table>
        </td></tr>

        ${
          tipsRows
            ? `
        <!-- Savings tips -->
        <tr><td style="padding: 20px 30px 10px;">
          <h2 style="font-size: 11px; font-weight: 800; color: #aaa; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1.5px;">Savings Opportunities</h2>
          <p style="font-size: 13px; color: #999; margin: 0 0 8px 0;">Free alternatives in categories you already pay for:</p>
          <table role="presentation" width="100%">${tipsRows}</table>
        </td></tr>`
            : ''
        }

        <!-- CTA -->
        <tr><td style="padding: 24px 30px 30px; text-align: center;">
          <a href="${APP_URL}/tracker" style="display: inline-block; background: ${PRIMARY_COLOR}; color: #fff; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 700; text-decoration: none;">View Your Stack &rarr;</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding: 24px 30px; border-top: 1px solid #eee; background: #fafafa;">
          <table role="presentation" width="100%">
            <tr>
              <td style="color: #999; font-size: 12px; line-height: 1.6;">
                Sent by <a href="${APP_URL}" style="color: ${PRIMARY_COLOR}; text-decoration: none; font-weight: 600;">AIPowerStacks</a><br>
                You received this because you track AI tools in your stack.<br>
                <a href="${unsubUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
              </td>
            </tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/* ── Main handler ────────────────────────────────────────────────────────────── */

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'newsletter@aipowerstacks.com'
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })
  }

  const resend = new Resend(resendKey)
  const supabase = createAdminClient()

  // Cron runs on the 1st — report covers the month just ended
  const now = new Date()
  const reportMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const monthLabel = reportMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const reportMonthKey = monthKey(reportMonth)
  // MoM baseline: the month before the report month
  const baselineMonth = new Date(reportMonth.getFullYear(), reportMonth.getMonth() - 1, 1)
  const baselineMonthKey = monthKey(baselineMonth)

  // 1. Fetch all user subscriptions
  const { data: subsData, error: subsErr } = await supabase
    .from('user_subscriptions')
    .select('user_id, tool_id, monthly_cost, billing_cycle')

  if (subsErr) {
    return NextResponse.json({ error: 'Failed to fetch subscriptions', detail: subsErr.message }, { status: 500 })
  }

  const rawSubs = (subsData ?? []) as SubRow[]
  if (rawSubs.length === 0) {
    return NextResponse.json({ message: 'No subscriptions found', sent: 0 })
  }

  const userIds = [...new Set(rawSubs.map((s) => s.user_id))]
  const toolIds = [...new Set(rawSubs.map((s) => s.tool_id))]

  // 2. Fetch tools + categories in parallel with everything else needed
  const [toolsRes, categoriesRes, snapshotsRes, authRes, profilesRes, unsubRes] = await Promise.all([
    supabase
      .from('tools')
      .select('id, name, slug, logo_url, pricing_model, category_id')
      .in('id', toolIds),
    supabase.from('categories').select('id, name'),
    // Previous month snapshots for MoM delta
    supabase
      .from('cost_snapshots')
      .select('user_id, month, total_monthly')
      .eq('month', baselineMonthKey)
      .in('user_id', userIds),
    // User emails from Supabase Auth
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase.from('profiles').select('id, display_name').in('id', userIds),
    supabase.from('newsletter_subscribers').select('email').eq('status', 'unsubscribed'),
  ])

  const toolMap = new Map<string, ToolRow>()
  for (const t of (toolsRes.data ?? []) as ToolRow[]) {
    toolMap.set(t.id, t)
  }

  const categoryMap = new Map<string, string>()
  for (const c of (categoriesRes.data ?? []) as CategoryRow[]) {
    categoryMap.set(c.id, c.name)
  }

  const snapshotMap = new Map<string, number>()
  for (const s of (snapshotsRes.data ?? []) as CostSnapshotRow[]) {
    snapshotMap.set(s.user_id, s.total_monthly)
  }

  const emailMap = new Map<string, string>()
  for (const u of authRes.data?.users ?? []) {
    if (u.email) emailMap.set(u.id, u.email)
  }

  const nameMap = new Map<string, string | null>()
  for (const p of (profilesRes.data ?? []) as Array<{ id: string; display_name: string | null }>) {
    nameMap.set(p.id, p.display_name)
  }

  const unsubEmails = new Set(
    (unsubRes.data ?? []).map((r: { email: string }) => r.email),
  )

  // 3. Enrich subscriptions with tool info
  const enrichedSubs: EnrichedSub[] = rawSubs.map((s) => {
    const tool = toolMap.get(s.tool_id) ?? null
    return {
      ...s,
      tool,
      categoryName: tool ? (categoryMap.get(tool.category_id) ?? null) : null,
    }
  })

  // 4. Build per-user map
  const byUser = new Map<string, EnrichedSub[]>()
  for (const sub of enrichedSubs) {
    const list = byUser.get(sub.user_id) ?? []
    list.push(sub)
    byUser.set(sub.user_id, list)
  }

  // 5. Fetch free/freemium alternatives in relevant categories
  const allCategoryIds = [...new Set(
    enrichedSubs.filter(s => s.tool != null).map(s => s.tool!.category_id),
  )]
  const allUserToolIds = new Set(rawSubs.map((s) => s.tool_id))

  let allAlts: AltTool[] = []
  if (allCategoryIds.length > 0) {
    const { data: altsData } = await supabase
      .from('tools')
      .select('id, name, slug, logo_url, pricing_model, category_id')
      .in('category_id', allCategoryIds)
      .in('pricing_model', ['free', 'freemium'])
      .eq('status', 'published')
      .limit(60)
    allAlts = ((altsData ?? []) as ToolRow[])
      .filter((t) => !allUserToolIds.has(t.id))
      .map((t) => ({ ...t, categoryName: categoryMap.get(t.category_id) ?? null }))
  }

  // 6. Send emails in batches of 50
  const userList = [...byUser.entries()]
  let sent = 0
  let errors = 0
  let skipped = 0

  for (let i = 0; i < userList.length; i += BATCH_SIZE) {
    const batch = userList.slice(i, i + BATCH_SIZE)

    const results = await Promise.allSettled(
      batch.map(async ([userId, userSubs]) => {
        const email = emailMap.get(userId)
        if (!email || unsubEmails.has(email)) {
          skipped++
          return null
        }

        const totalMonthly = userSubs.reduce((sum, s) => sum + s.monthly_cost, 0)
        if (totalMonthly <= 0) {
          skipped++
          return null
        }

        const prevTotal = snapshotMap.get(userId) ?? null
        const momDelta = prevTotal != null ? totalMonthly - prevTotal : null

        // Alternatives for this user's categories only, excluding their current tools
        const userToolIds = new Set(userSubs.map((s) => s.tool_id))
        const userCatIds = new Set(
          userSubs.filter((s) => s.tool != null).map((s) => s.tool!.category_id),
        )
        const userAlts = allAlts.filter(
          (a) => userCatIds.has(a.category_id) && !userToolIds.has(a.id),
        )

        const unsubUrl = `${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`
        const html = buildSpendEmailHtml(
          nameMap.get(userId) ?? null,
          totalMonthly,
          momDelta,
          userSubs,
          userAlts,
          unsubUrl,
          monthLabel,
        )

        return resend.emails.send({
          from: `AIPowerStacks <${fromEmail}>`,
          to: email,
          subject: `Your AI spend report — ${monthLabel}`,
          html,
        })
      }),
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value && !result.value.error) {
        sent++
      } else if (result.status === 'rejected') {
        errors++
      }
    }
  }

  // 7. Upsert cost snapshots for the report month (provides MoM baseline for next run)
  const snapshots = [...byUser.entries()].map(([userId, userSubs]) => ({
    user_id: userId,
    month: reportMonthKey,
    total_monthly: userSubs.reduce((sum, s) => sum + s.monthly_cost, 0),
    tool_count: userSubs.length,
  }))

  if (snapshots.length > 0) {
    await supabase
      .from('cost_snapshots')
      .upsert(snapshots, { onConflict: 'user_id,month' })
  }

  return NextResponse.json({
    message: 'Spend report sent',
    monthLabel,
    usersWithSubs: byUser.size,
    sent,
    errors,
    skipped,
  })
}
