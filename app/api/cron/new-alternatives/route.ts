import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fromTable } from '@/lib/supabase/untyped'
import { Resend } from 'resend'
import { SITE_URL } from '@/lib/constants/site'

export const maxDuration = 60

type NewTool = {
  id: string
  name: string
  slug: string
  category_id: string
  tagline: string | null
  created_at: string
  categories: { name: string } | null
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

  // Find tools published in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: newTools } = await supabase
    .from('tools')
    .select('id, name, slug, category_id, tagline, created_at, categories:category_id(name)')
    .gte('created_at', oneDayAgo)
    .not('category_id', 'is', null)
    .order('created_at', { ascending: false }) as { data: NewTool[] | null }

  if (!newTools || newTools.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no new tools' })
  }

  // Get unique category IDs from new tools
  const categoryIds = [...new Set(newTools.map(t => t.category_id))]

  // Find users who subscribe to tools in those categories
  type SubRow = {
    user_id: string
    tool_id: string
    tools: { name: string; category_id: string | null } | null
  }

  const { data: affectedSubs } = await supabase
    .from('user_subscriptions')
    .select('user_id, tool_id, tools:tool_id(name, category_id)')
    .in('tools.category_id', categoryIds) as { data: SubRow[] | null }

  if (!affectedSubs || affectedSubs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no users in affected categories' })
  }

  // Filter to subs that actually match (supabase inner-join filter on relations can be loose)
  const validSubs = affectedSubs.filter(s => s.tools?.category_id && categoryIds.includes(s.tools.category_id))

  // Group by user → relevant new tools
  const userToolMap = new Map<string, { newTools: NewTool[]; existingToolNames: Set<string> }>()

  for (const sub of validSubs) {
    const catId = sub.tools?.category_id
    if (!catId) continue

    const entry = userToolMap.get(sub.user_id) || { newTools: [], existingToolNames: new Set() }
    if (sub.tools?.name) entry.existingToolNames.add(sub.tools.name)

    const relevantNew = newTools.filter(nt => nt.category_id === catId)
    for (const nt of relevantNew) {
      if (!entry.newTools.some(x => x.id === nt.id)) {
        entry.newTools.push(nt)
      }
    }

    userToolMap.set(sub.user_id, entry)
  }

  // Check which users already received an email today (max 1/day)
  const today = new Date().toISOString().slice(0, 10)

  type EmailLog = { user_id: string }
  const { data: recentEmails } = await fromTable(supabase, 'email_logs')
    .select('user_id')
    .eq('email_type', 'new_alternatives')
    .gte('created_at', `${today}T00:00:00Z`)
    .limit(1000) as { data: EmailLog[] | null }

  const alreadyEmailed = new Set((recentEmails || []).map(e => e.user_id))

  let sent = 0
  const errors: string[] = []

  for (const [userId, { newTools: userNewTools, existingToolNames }] of userToolMap) {
    if (alreadyEmailed.has(userId)) continue
    if (userNewTools.length === 0) continue

    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    if (!user?.email) continue

    const toolLines = userNewTools.map(nt => {
      const catName = nt.categories?.name || 'your category'
      const tagline = nt.tagline ? ` — ${nt.tagline}` : ''
      return `<p style="margin:4px 0">🆕 <a href="${SITE_URL}/ai/${nt.slug}" style="color:#d03050;font-weight:600">${nt.name}</a>${tagline} <span style="color:#666">(${catName})</span></p>`
    }).join('\n')

    const existingList = [...existingToolNames].slice(0, 3).join(', ')
    const subject = userNewTools.length === 1
      ? `🆕 New alternative to ${existingList}: ${userNewTools[0].name}`
      : `🆕 ${userNewTools.length} new tools in categories you track`

    try {
      await resend.emails.send({
        from: 'AIPowerStacks <newsletter@aipowerstacks.com>',
        to: user.email,
        subject,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <h2 style="margin:0 0 8px">New Alternatives Spotted</h2>
            <p style="color:#666;margin:0 0 16px">We found new tools in categories you're tracking (${existingList}).</p>
            ${toolLines}
            <hr style="margin:24px 0;border:none;border-top:1px solid #e5e5e5" />
            <p style="margin:0"><a href="${SITE_URL}/tracker" style="color:#d03050;font-weight:600">Compare in your stack →</a></p>
            <p style="color:#999;font-size:12px;margin:16px 0 0">You're receiving this because you track tools in ${existingList ? `the same category as ${existingList}` : 'these categories'} on AIPowerStacks.</p>
          </div>
        `,
      })
      sent++

      // Log the email to enforce max 1/day
      await fromTable(supabase, 'email_logs')
        .insert({ user_id: userId, email_type: 'new_alternatives', created_at: new Date().toISOString() })
    } catch (err) {
      errors.push(`${userId}: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    newToolsFound: newTools.length,
    categories: categoryIds.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
