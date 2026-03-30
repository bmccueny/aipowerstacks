import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check admin role
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const STALE_DAYS = 30
  const staleThreshold = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: tiers, error } = await admin
    .from('tool_pricing_tiers')
    .select('tool_id, last_verified_at, tools!inner(id, name, slug)')
    .or(`last_verified_at.is.null,last_verified_at.lt.${staleThreshold}`)
    .order('last_verified_at', { ascending: true, nullsFirst: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aggregate per tool
  const toolMap = new Map<string, { name: string; slug: string; tierCount: number; oldestVerified: string | null }>()
  for (const tier of tiers || []) {
    const t = tier.tools as unknown as { name: string; slug: string }
    const existing = toolMap.get(tier.tool_id)
    if (!existing) {
      toolMap.set(tier.tool_id, { name: t.name, slug: t.slug, tierCount: 1, oldestVerified: tier.last_verified_at })
    } else {
      existing.tierCount++
      if (existing.oldestVerified !== null && tier.last_verified_at === null) {
        existing.oldestVerified = null
      }
    }
  }

  // Get tracker counts
  const { data: subs } = await admin
    .from('user_subscriptions')
    .select('tool_id')
    .in('tool_id', [...toolMap.keys()])

  const trackerCounts: Record<string, number> = {}
  for (const s of subs || []) {
    trackerCounts[s.tool_id] = (trackerCounts[s.tool_id] || 0) + 1
  }

  const results = [...toolMap.entries()]
    .map(([toolId, t]) => ({
      toolId,
      name: t.name,
      slug: t.slug,
      tierCount: t.tierCount,
      daysSinceVerified: t.oldestVerified
        ? Math.floor((Date.now() - new Date(t.oldestVerified).getTime()) / 86400000)
        : null,
      trackers: trackerCounts[toolId] || 0,
    }))
    .sort((a, b) => b.trackers - a.trackers)

  return NextResponse.json({ staleDays: STALE_DAYS, staleTools: results.length, tools: results })
}
