import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Sub = { tool_id: string; monthly_cost: number; tools: { name: string; slug: string; logo_url: string | null } | null }

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

function parseFeatures(f: string[] | string | null): string[] {
  if (!f) return []
  if (Array.isArray(f)) return f
  try { return JSON.parse(f) } catch { return f.split(',').map(s => s.trim()).filter(Boolean) }
}

function buildComparisons(
  subs: Sub[],
  allTiers: { tool_id: string; tier_name: string; monthly_price: number; features: string[] | string | null }[]
): Comparison[] {
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
        features: parseFeatures(currentTier.features),
      } : null,
      next_tier: nextTier ? {
        name: nextTier.tier_name,
        price: nextTier.monthly_price,
        features: parseFeatures(nextTier.features),
      } : null,
      all_tiers: paidTiers.map(t => ({
        name: t.tier_name,
        price: t.monthly_price,
        features: parseFeatures(t.features),
      })),
    })
  }

  // Sort: tools with upgrade options first
  comparisons.sort((a, b) => (b.next_tier ? 1 : 0) - (a.next_tier ? 1 : 0))
  return comparisons
}

export async function GET(request: Request) {
  const ip = getClientIp(request)
  const { success } = rateLimit(`tracker:tier-compare:${ip}`)
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

  return NextResponse.json({ comparisons: buildComparisons(subs, allTiers as typeof allTiers & { features: string[] | string | null }[]) })
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const { success } = rateLimit(`tracker:tier-compare:anon:${ip}`, 10)
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

  const [{ data: toolRows, error: toolsError }, { data: allTiers, error: tiersError }] = await Promise.all([
    admin.from('tools').select('id, name, slug, logo_url').in('id', toolIds),
    admin.from('tool_pricing_tiers')
      .select('tool_id, tier_name, monthly_price, features')
      .in('tool_id', toolIds)
      .order('monthly_price', { ascending: true }),
  ])

  if (toolsError) return NextResponse.json({ error: toolsError.message }, { status: 500 })
  if (tiersError) return NextResponse.json({ error: tiersError.message }, { status: 500 })

  if (!allTiers || allTiers.length === 0) {
    return NextResponse.json({ comparisons: [] })
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

  return NextResponse.json({ comparisons: buildComparisons(subs, allTiers as typeof allTiers & { features: string[] | string | null }[]) })
}
