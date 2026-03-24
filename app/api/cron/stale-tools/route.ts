import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  let archivedCount = 0
  let flaggedCount = 0
  const archivedNames: string[] = []
  const flaggedNames: string[] = []

  // ── 1. Auto-archive tools whose website is dead (404/500) ──
  // Uses the tool_health table populated by the health-check cron
  try {
    const { data: deadTools } = await supabase
      .from('tool_health' as string)
      .select('tool_id, status_code')
      .eq('is_up', false)
      .in('status_code', [404, 410, 500, 502, 503, 0])

    if (deadTools && deadTools.length > 0) {
      const deadIds = (deadTools as { tool_id: string }[]).map(t => t.tool_id)

      const { data: toolsToArchive } = await supabase
        .from('tools')
        .select('id, name')
        .eq('status', 'published')
        .in('id', deadIds)

      if (toolsToArchive && toolsToArchive.length > 0) {
        const { error } = await supabase
          .from('tools')
          .update({ status: 'archived' })
          .in('id', toolsToArchive.map(t => t.id))

        if (!error) {
          archivedCount = toolsToArchive.length
          archivedNames.push(...toolsToArchive.map(t => t.name))
        }
      }
    }
  } catch {
    // tool_health table may not exist — skip silently
  }

  // ── 2. Flag stale tools (>90 days without update) ──
  const { data: staleTools } = await supabase
    .from('tools')
    .select('id, name')
    .eq('status', 'published')
    .lt('updated_at', ninetyDaysAgo)
    .order('updated_at', { ascending: true })
    .limit(50)

  if (staleTools && staleTools.length > 0) {
    flaggedCount = staleTools.length
    flaggedNames.push(...staleTools.slice(0, 10).map(t => t.name))

    // Try to set needs_review flag (column may not exist yet)
    try {
      await supabase
        .from('tools')
        .update({
          needs_review: true,
          needs_review_reason: 'Not updated in 90+ days',
        } as Record<string, unknown>)
        .in('id', staleTools.map(t => t.id))
        .eq('needs_review' as string, false)
    } catch {
      // needs_review column may not exist yet — that's ok
    }
  }

  return NextResponse.json({
    message: 'Stale tools check completed',
    archived: archivedCount,
    archived_tools: archivedNames,
    flagged_for_review: flaggedCount,
    flagged_sample: flaggedNames,
  })
}
