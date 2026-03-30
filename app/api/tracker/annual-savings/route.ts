import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const ip = getClientIp(request)
  const { success } = rateLimit(`tracker:annual-savings:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get user's subscriptions
  const { data: subs } = await supabase
    .from('user_subscriptions')
    .select('tool_id, monthly_cost, tools:tool_id(name, slug, logo_url)')
    .eq('user_id', user.id)

  if (!subs || subs.length === 0) {
    return NextResponse.json({ savings: [], totalAnnualSavings: 0 })
  }

  const toolIds = subs.map(s => s.tool_id)

  // Get pricing tiers with annual prices
  const { data: tiers } = await supabase
    .from('tool_pricing_tiers')
    .select('tool_id, tier_name, monthly_price, annual_price, features')
    .in('tool_id', toolIds)
    .not('annual_price', 'is', null)

  if (!tiers || tiers.length === 0) {
    return NextResponse.json({ savings: [], totalAnnualSavings: 0 })
  }

  const savings: Array<{
    tool_id: string
    tool_name: string
    tool_slug: string
    logo_url: string | null
    tier_name: string
    monthly_price: number
    annual_price: number
    yearly_if_monthly: number
    annual_savings: number
    savings_percent: number
  }> = []

  for (const sub of subs) {
    const toolTiers = tiers.filter(t => t.tool_id === sub.tool_id)
    if (toolTiers.length === 0) continue

    // Find the tier closest to what the user is paying
    const currentCost = Number(sub.monthly_cost)
    if (currentCost <= 0) continue

    const matchedTier = toolTiers.reduce((best, t) =>
      !best || Math.abs(t.monthly_price - currentCost) < Math.abs(best.monthly_price - currentCost)
        ? t : best
    , null as (typeof toolTiers)[0] | null)

    if (!matchedTier || !matchedTier.annual_price) continue

    const yearlyIfMonthly = matchedTier.monthly_price * 12
    const annualSavings = yearlyIfMonthly - matchedTier.annual_price
    const savingsPercent = yearlyIfMonthly > 0 ? (annualSavings / yearlyIfMonthly) * 100 : 0

    // Only include if savings > 5%
    if (savingsPercent <= 5) continue

    const tool = sub.tools as unknown as { name: string; slug: string; logo_url: string | null } | null
    savings.push({
      tool_id: sub.tool_id,
      tool_name: tool?.name || 'Unknown',
      tool_slug: tool?.slug || '',
      logo_url: tool?.logo_url || null,
      tier_name: matchedTier.tier_name,
      monthly_price: matchedTier.monthly_price,
      annual_price: matchedTier.annual_price,
      yearly_if_monthly: yearlyIfMonthly,
      annual_savings: annualSavings,
      savings_percent: Math.round(savingsPercent),
    })
  }

  // Sort by savings amount descending
  savings.sort((a, b) => b.annual_savings - a.annual_savings)

  const totalAnnualSavings = savings.reduce((sum, s) => sum + s.annual_savings, 0)

  return NextResponse.json({ savings, totalAnnualSavings })
}
