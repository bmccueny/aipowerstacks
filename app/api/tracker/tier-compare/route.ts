import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const ip = getClientIp(request)
  const { success } = rateLimit(`tracker:tier-compare:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  type Sub = { tool_id: string; monthly_cost: number; tools: { name: string; slug: string; logo_url: string | null } | null }
  const { data: rawSubs } = await supabase
    .from('user_subscriptions')
    .select('tool_id, monthly_cost, tools:tool_id(name, slug, logo_url)')
    .eq('user_id', user.id)
    .gt('monthly_cost', 0)
  const subs = (rawSubs ?? []) as unknown as Sub[]

  if (subs.length === 0) {
    return NextResponse.json({ comparisons: [] })
  }

  const toolIds = subs.map(s => s.tool_id)

  const { data: allTiers } = await supabase
    .from('tool_pricing_tiers')
    .select('tool_id, tier_name, monthly_price, features')
    .in('tool_id', toolIds)
    .order('monthly_price', { ascending: true })

  if (!allTiers || allTiers.length === 0) {
    return NextResponse.json({ comparisons: [] })
  }

  const parseFeatures = (f: string[] | string | null): string[] => {
    if (!f) return []
    if (Array.isArray(f)) return f
    try { return JSON.parse(f) } catch { return f.split(',').map(s => s.trim()).filter(Boolean) }
  }

  type TierInfo = { name: string; price: number; features: string[] }
  type Comparison = {
    tool_id: string
    tool_name: string
    tool_slug: string
    logo_url: string | null
    current_cost: number
    current_tier: TierInfo | null
    next_tier: TierInfo | null
    all_tiers: TierInfo[]
  }

  const comparisons: Comparison[] = []

  for (const sub of subs) {
    const toolTiers = allTiers.filter(t => t.tool_id === sub.tool_id)
    // Only show comparisons for tools with multiple paid tiers
    const paidTiers = toolTiers.filter(t => t.monthly_price > 0)
    if (paidTiers.length < 2) continue

    const currentCost = Number(sub.monthly_cost)

    // Find the tier closest to user's cost
    const currentTier = paidTiers.reduce((best, t) =>
      !best || Math.abs(t.monthly_price - currentCost) < Math.abs(best.monthly_price - currentCost)
        ? t : best
    , null as (typeof paidTiers)[0] | null)

    // Find the next tier up (if any)
    const nextTier = currentTier
      ? paidTiers.find(t => t.monthly_price > currentTier.monthly_price)
      : null

    const tool = sub.tools
    comparisons.push({
      tool_id: sub.tool_id,
      tool_name: tool?.name || 'Unknown',
      tool_slug: tool?.slug || '',
      logo_url: tool?.logo_url || null,
      current_cost: currentCost,
      current_tier: currentTier ? {
        name: currentTier.tier_name,
        price: currentTier.monthly_price,
        features: parseFeatures(currentTier.features as string[] | string | null),
      } : null,
      next_tier: nextTier ? {
        name: nextTier.tier_name,
        price: nextTier.monthly_price,
        features: parseFeatures(nextTier.features as string[] | string | null),
      } : null,
      all_tiers: paidTiers.map(t => ({
        name: t.tier_name,
        price: t.monthly_price,
        features: parseFeatures(t.features as string[] | string | null),
      })),
    })
  }

  // Sort: tools with upgrade options first
  comparisons.sort((a, b) => (b.next_tier ? 1 : 0) - (a.next_tier ? 1 : 0))

  return NextResponse.json({ comparisons })
}
