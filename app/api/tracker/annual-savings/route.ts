import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Sub = { tool_id: string; monthly_cost: number; tools: { name: string; slug: string; logo_url: string | null } | null }

type SavingsRow = {
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
}

function buildSavings(
  subs: Sub[],
  tiers: { tool_id: string; tier_name: string; monthly_price: number; annual_price: number | null }[]
): { savings: SavingsRow[]; totalAnnualSavings: number } {
  const savings: SavingsRow[] = []

  for (const sub of subs) {
    const toolTiers = tiers.filter(t => t.tool_id === sub.tool_id)
    if (toolTiers.length === 0) continue

    const currentCost = Number(sub.monthly_cost)
    if (currentCost <= 0) continue

    // Find the tier closest to what the user is paying
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

    const tool = sub.tools
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

  savings.sort((a, b) => b.annual_savings - a.annual_savings)
  const totalAnnualSavings = savings.reduce((sum, s) => sum + s.annual_savings, 0)
  return { savings, totalAnnualSavings }
}

export async function GET(request: Request) {
  const ip = getClientIp(request)
  const { success } = rateLimit(`tracker:annual-savings:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: rawSubs } = await supabase
    .from('user_subscriptions')
    .select('tool_id, monthly_cost, tools:tool_id(name, slug, logo_url)')
    .eq('user_id', user.id)
  const subs = (rawSubs ?? []) as unknown as Sub[]

  if (subs.length === 0) {
    return NextResponse.json({ savings: [], totalAnnualSavings: 0 })
  }

  const toolIds = subs.map(s => s.tool_id)

  const { data: tiers } = await supabase
    .from('tool_pricing_tiers')
    .select('tool_id, tier_name, monthly_price, annual_price, features')
    .in('tool_id', toolIds)
    .not('annual_price', 'is', null)

  if (!tiers || tiers.length === 0) {
    return NextResponse.json({ savings: [], totalAnnualSavings: 0 })
  }

  return NextResponse.json(buildSavings(subs, tiers as typeof tiers & { annual_price: number | null }[]))
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const { success } = rateLimit(`tracker:annual-savings:anon:${ip}`, 10)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const tools = (body as { tools?: unknown }).tools
  if (!Array.isArray(tools) || tools.length < 2 || tools.length > 50) {
    return NextResponse.json({ error: 'tools must be an array of 2–50 items' }, { status: 400 })
  }

  const items = tools as { tool_id?: unknown; monthly_cost?: unknown }[]
  if (!items.every(t => typeof t.tool_id === 'string' && UUID_RE.test(t.tool_id) && typeof t.monthly_cost === 'number')) {
    return NextResponse.json({ error: 'Each tool must have a valid UUID tool_id and numeric monthly_cost' }, { status: 400 })
  }

  const validTools = items as { tool_id: string; monthly_cost: number }[]
  const toolIds = validTools.map(t => t.tool_id)

  const admin = createAdminClient()

  const [{ data: toolRows, error: toolsError }, { data: tiers, error: tiersError }] = await Promise.all([
    admin.from('tools').select('id, name, slug, logo_url').in('id', toolIds),
    admin.from('tool_pricing_tiers')
      .select('tool_id, tier_name, monthly_price, annual_price')
      .in('tool_id', toolIds)
      .not('annual_price', 'is', null),
  ])

  if (toolsError) return NextResponse.json({ error: toolsError.message }, { status: 500 })
  if (tiersError) return NextResponse.json({ error: tiersError.message }, { status: 500 })

  if (!tiers || tiers.length === 0) {
    return NextResponse.json({ savings: [], totalAnnualSavings: 0 })
  }

  const toolMeta = new Map((toolRows ?? []).map(t => [t.id, t]))

  const subs: Sub[] = validTools
    .filter(t => toolMeta.has(t.tool_id))
    .map(t => {
      const meta = toolMeta.get(t.tool_id)!
      return {
        tool_id: t.tool_id,
        monthly_cost: t.monthly_cost,
        tools: {
          name: meta.name,
          slug: meta.slug,
          logo_url: (meta.logo_url as string | null) ?? null,
        },
      }
    })

  return NextResponse.json(buildSavings(subs, tiers as typeof tiers & { annual_price: number | null }[]))
}
