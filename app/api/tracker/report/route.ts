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
      // Use shared use_case label or category name
      const useCases = new Set(items.map(s => s.tools?.use_case).filter(Boolean))
      const sharedUseCase = useCases.size === 1 ? [...useCases][0] : null
      const label = sharedUseCase
        ? USE_CASE_LABELS[sharedUseCase] || sharedUseCase
        : catNameMap.get(catId) || 'Similar Tools'

      // Score each tool: rating weighted by review confidence
      // A 4.8 with 50 reviews > a 5.0 with 1 review
      const scored = items.map(s => {
        const rating = s.tools?.avg_rating || 0
        const reviews = s.tools?.review_count || 0
        const confidence = Math.log2(reviews + 1)
        return {
          name: s.tools?.name || '?',
          slug: s.tools?.slug || '',
          logo_url: s.tools?.logo_url,
          cost: Number(s.monthly_cost),
          rating,
          reviews,
          score: rating * confidence,
        }
      }).sort((a, b) => b.score - a.score)

      const topPick = scored[0]
      const totalCost = scored.reduce((s, t) => s + t.cost, 0)
      // Savings = drop everything except the top-rated tool
      const savingsIfKeepBest = Math.round((totalCost - topPick.cost) * 12)

      return {
        label,
        tools: scored,
        topPick: topPick.name,
        topPickSlug: topPick.slug,
        totalCost,
        savingsIfKeepBest,
      }
    })
    .filter(o => o.tools.length >= 2)
    .sort((a, b) => b.savingsIfKeepBest - a.savingsIfKeepBest)

  // ── 2. Premium overlap — only suggest tier downgrades when the user
  // is paying top-tier on MULTIPLE tools in the same category.
  // "You're on Pro for both Claude and ChatGPT ($400/mo). Pick one to
  // stay Pro, drop the other to a free/basic tier."
  // We never suggest downgrading a single tool in isolation — you don't
  // know why they're on that tier.
  type PremiumOverlap = {
    label: string
    tools: { name: string; slug: string; cost: number; cheapestTier: string; cheapestCost: number }[]
    totalCost: number
    savingsIfDowngradeRest: number
  }
  const premiumOverlaps: PremiumOverlap[] = []

  // For each overlap group, check if multiple tools are on premium tiers
  for (const [catId, items] of categoryGroups.entries()) {
    if (items.length < 2) continue

    // Get cheapest paid tier for each tool to detect who's on a premium tier
    const toolTierInfo: { sub: Sub; cheapestCost: number; cheapestTier: string }[] = []
    for (const sub of items) {
      const userCost = Number(sub.monthly_cost)
      if (userCost === 0) continue

      const { data: tiers } = await untypedFrom(supabase, 'tool_pricing_tiers')
        .select('tier_name, monthly_price')
        .eq('tool_id', sub.tool_id)
        .gt('monthly_price', 0)
        .order('monthly_price', { ascending: true })
        .limit(1)

      const cheapest = tiers?.[0]
      if (cheapest && userCost > cheapest.monthly_price * 1.3) {
        // This user is on a tier above the cheapest — they're "premium"
        toolTierInfo.push({
          sub,
          cheapestCost: cheapest.monthly_price,
          cheapestTier: cheapest.tier_name,
        })
      }
    }

    // Only flag if 2+ tools in the same category are on premium tiers
    if (toolTierInfo.length >= 2) {
      // Sort by cost descending — keep the most expensive at premium,
      // suggest downgrading the rest
      toolTierInfo.sort((a, b) => Number(b.sub.monthly_cost) - Number(a.sub.monthly_cost))

      const keepAtPremium = toolTierInfo[0]
      const downgradeTargets = toolTierInfo.slice(1)
      const savingsIfDowngradeRest = downgradeTargets.reduce(
        (s, t) => s + Math.round((Number(t.sub.monthly_cost) - t.cheapestCost) * 12), 0
      )

      if (savingsIfDowngradeRest > 0) {
        const useCases = new Set(items.map(s => s.tools?.use_case).filter(Boolean))
        const sharedUseCase = useCases.size === 1 ? [...useCases][0] : null
        const label = sharedUseCase
          ? USE_CASE_LABELS[sharedUseCase] || sharedUseCase
          : catNameMap.get(catId) || 'Similar Tools'

        premiumOverlaps.push({
          label,
          tools: toolTierInfo.map(t => ({
            name: t.sub.tools?.name || '?',
            slug: t.sub.tools?.slug || '',
            cost: Number(t.sub.monthly_cost),
            cheapestTier: t.cheapestTier,
            cheapestCost: t.cheapestCost,
          })),
          totalCost: toolTierInfo.reduce((s, t) => s + Number(t.sub.monthly_cost), 0),
          savingsIfDowngradeRest,
        })
      }
    }
  }

  premiumOverlaps.sort((a, b) => b.savingsIfDowngradeRest - a.savingsIfDowngradeRest)

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
  const overlapSavings = overlaps.reduce((s, o) => s + o.savingsIfKeepBest, 0)
  const premiumSavings = premiumOverlaps.reduce((s, p) => s + p.savingsIfDowngradeRest, 0)
  const totalPotentialSavings = overlapSavings + premiumSavings

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
      premiumOverlaps,
      benchmark: { avgMonthly, percentile },
      totalPotentialSavings,
      verdict,
    },
  })
}
