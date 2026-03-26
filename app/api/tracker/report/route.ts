import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function untypedFrom(supabase: any, table: string) { return supabase.from(table) }

const USE_CASE_LABELS: Record<string, string> = {
  coding: 'Coding & Development',
  'content-creation': 'Content Creation',
  marketing: 'Marketing',
  design: 'Design',
  research: 'Research',
  video: 'Video',
  sales: 'Sales',
  'customer-support': 'Customer Support',
}

type Sub = {
  tool_id: string
  monthly_cost: number
  tools: {
    name: string
    slug: string
    logo_url: string | null
    category_id: string | null
    use_case: string | null
    avg_rating: number
    review_count: number
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get user's subscriptions with tool details
  const { data: rawSubs } = await untypedFrom(supabase, 'user_subscriptions')
    .select('tool_id, monthly_cost, tools:tool_id(name, slug, logo_url, category_id, use_case, avg_rating, review_count)')
    .eq('user_id', user.id)

  const subs = (rawSubs || []) as Sub[]
  if (subs.length === 0) return NextResponse.json({ report: null })

  const totalMonthly = subs.reduce((sum, s) => sum + Number(s.monthly_cost), 0)
  const totalYearly = totalMonthly * 12

  // ── 1. Find overlap groups (by category_id)
  const categoryGroups = new Map<string, Sub[]>()
  for (const sub of subs) {
    const catId = sub.tools?.category_id
    if (!catId) continue
    const list = categoryGroups.get(catId) || []
    list.push(sub)
    categoryGroups.set(catId, list)
  }

  // Get category names
  const catIds = Array.from(categoryGroups.keys())
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .in('id', catIds)

  const catNameMap = new Map<string, string>()
  for (const cat of categories || []) {
    catNameMap.set(cat.id, cat.name)
  }

  const overlaps = Array.from(categoryGroups.entries())
    .filter(([, items]) => items.length >= 2)
    .map(([catId, items]) => {
      const costs = items.map(s => Number(s.monthly_cost)).sort((a, b) => a - b)
      const cheapest = costs[0]
      const savingsIfKeepOne = (items.reduce((s, i) => s + Number(i.monthly_cost), 0) - cheapest) * 12

      // Use shared use_case label or category name
      const useCases = new Set(items.map(s => s.tools?.use_case).filter(Boolean))
      const sharedUseCase = useCases.size === 1 ? [...useCases][0] : null
      const label = sharedUseCase
        ? USE_CASE_LABELS[sharedUseCase] || sharedUseCase
        : catNameMap.get(catId) || 'Similar Tools'

      return {
        label,
        tools: items.map(s => ({
          name: s.tools?.name || '?',
          slug: s.tools?.slug || '',
          logo_url: s.tools?.logo_url,
          cost: Number(s.monthly_cost),
          rating: s.tools?.avg_rating || 0,
          reviews: s.tools?.review_count || 0,
        })),
        totalCost: items.reduce((s, i) => s + Number(i.monthly_cost), 0),
        savingsIfKeepOne,
      }
    })
    .filter(o => o.savingsIfKeepOne > 0)
    .sort((a, b) => b.savingsIfKeepOne - a.savingsIfKeepOne)

  // ── 2. Tier downgrade opportunities
  const tierChecks: { toolName: string; toolSlug: string; currentCost: number; cheapestTier: string; cheapestCost: number; yearlySavings: number }[] = []

  for (const sub of subs) {
    if (Number(sub.monthly_cost) === 0) continue
    const { data: tiers } = await untypedFrom(supabase, 'tool_pricing_tiers')
      .select('tier_name, monthly_price')
      .eq('tool_id', sub.tool_id)
      .gt('monthly_price', 0)
      .order('monthly_price', { ascending: true })
      .limit(1)

    if (tiers && tiers.length > 0) {
      const cheapest = tiers[0]
      const userCost = Number(sub.monthly_cost)
      if (userCost > cheapest.monthly_price * 1.4) {
        tierChecks.push({
          toolName: sub.tools?.name || '?',
          toolSlug: sub.tools?.slug || '',
          currentCost: userCost,
          cheapestTier: cheapest.tier_name,
          cheapestCost: cheapest.monthly_price,
          yearlySavings: Math.round((userCost - cheapest.monthly_price) * 12),
        })
      }
    }
  }

  tierChecks.sort((a, b) => b.yearlySavings - a.yearlySavings)

  // ── 3. Benchmark
  const { data: allSubs } = await untypedFrom(supabase, 'user_subscriptions')
    .select('user_id, monthly_cost')

  let avgMonthly = 89
  let percentile = 50
  if (allSubs && allSubs.length > 0) {
    const userTotals = new Map<string, number>()
    for (const s of allSubs) {
      userTotals.set(s.user_id, (userTotals.get(s.user_id) || 0) + Number(s.monthly_cost))
    }
    const totals = Array.from(userTotals.values()).sort((a, b) => a - b)
    avgMonthly = Math.round(totals.reduce((s, v) => s + v, 0) / totals.length)
    const belowCount = totals.filter(t => t < totalMonthly).length
    percentile = totals.length > 1 ? Math.round((belowCount / totals.length) * 100) : 50
  }

  // ── 4. Total potential savings
  const overlapSavings = overlaps.reduce((s, o) => s + o.savingsIfKeepOne, 0)
  const tierSavings = tierChecks.reduce((s, t) => s + t.yearlySavings, 0)
  const totalPotentialSavings = overlapSavings + tierSavings

  // ── 5. Verdict
  let verdict = ''
  if (totalPotentialSavings === 0) {
    verdict = 'Your stack looks lean. No obvious waste detected.'
  } else if (totalPotentialSavings < 200) {
    verdict = `Minor optimization possible. You could save ~$${totalPotentialSavings}/year with small adjustments.`
  } else if (totalPotentialSavings < 1000) {
    verdict = `Real savings available. Consolidating overlaps and checking your tiers could save you $${totalPotentialSavings}/year.`
  } else {
    verdict = `Significant waste detected. You could save $${totalPotentialSavings}/year — that's $${Math.round(totalPotentialSavings / 12)}/month back in your pocket.`
  }

  return NextResponse.json({
    report: {
      totalMonthly: Math.round(totalMonthly),
      totalYearly,
      toolCount: subs.length,
      overlaps,
      tierChecks,
      benchmark: { avgMonthly, percentile },
      totalPotentialSavings,
      verdict,
    },
  })
}
