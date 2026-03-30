import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const ip = getClientIp(request)
  const { success } = rateLimit(`tracker:free-tier:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get user's paid subscriptions
  type Sub = { tool_id: string; monthly_cost: number; tools: { name: string; slug: string; logo_url: string | null } | null }
  const { data: rawSubs } = await supabase
    .from('user_subscriptions')
    .select('tool_id, monthly_cost, tools:tool_id(name, slug, logo_url)')
    .eq('user_id', user.id)
    .gt('monthly_cost', 0)
  const subs = (rawSubs ?? []) as unknown as Sub[]

  if (!subs || subs.length === 0) {
    return NextResponse.json({ alternatives: [] })
  }

  const toolIds = subs.map(s => s.tool_id)

  // Get all tiers for these tools
  const { data: allTiers } = await supabase
    .from('tool_pricing_tiers')
    .select('tool_id, tier_name, monthly_price, features')
    .in('tool_id', toolIds)
    .order('monthly_price', { ascending: true })

  if (!allTiers || allTiers.length === 0) {
    return NextResponse.json({ alternatives: [] })
  }

  const alternatives: Array<{
    tool_id: string
    tool_name: string
    tool_slug: string
    logo_url: string | null
    current_cost: number
    free_tier_name: string
    free_features: string[]
    paid_tier_name: string
    paid_features: string[]
    monthly_savings: number
  }> = []

  for (const sub of subs) {
    const toolTiers = allTiers.filter(t => t.tool_id === sub.tool_id)
    const freeTier = toolTiers.find(t => t.monthly_price === 0)
    if (!freeTier) continue

    // Find the paid tier closest to user's current cost
    const currentCost = Number(sub.monthly_cost)
    const paidTiers = toolTiers.filter(t => t.monthly_price > 0)
    const currentTier = paidTiers.reduce((best, t) =>
      !best || Math.abs(t.monthly_price - currentCost) < Math.abs(best.monthly_price - currentCost)
        ? t : best
    , null as (typeof paidTiers)[0] | null)

    const parseFeatures = (f: string[] | string | null): string[] => {
      if (!f) return []
      if (Array.isArray(f)) return f
      try { return JSON.parse(f) } catch { return f.split(',').map(s => s.trim()).filter(Boolean) }
    }

    const freeFeatures = parseFeatures(freeTier.features as string[] | string | null)
    const paidFeatures = currentTier ? parseFeatures(currentTier.features as string[] | string | null) : []

    const tool = sub.tools
    alternatives.push({
      tool_id: sub.tool_id,
      tool_name: tool?.name || 'Unknown',
      tool_slug: tool?.slug || '',
      logo_url: tool?.logo_url || null,
      current_cost: currentCost,
      free_tier_name: freeTier.tier_name,
      free_features: freeFeatures,
      paid_tier_name: currentTier?.tier_name || 'Paid',
      paid_features: paidFeatures,
      monthly_savings: currentCost,
    })
  }

  // Sort by potential savings descending
  alternatives.sort((a, b) => b.monthly_savings - a.monthly_savings)

  return NextResponse.json({ alternatives })
}
