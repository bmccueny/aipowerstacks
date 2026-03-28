import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'



const USE_CASE_LABELS: Record<string, string> = {
  coding: 'Coding', 'content-creation': 'Content', marketing: 'Marketing',
  design: 'Design', research: 'Research', video: 'Video', sales: 'Sales',
  'customer-support': 'Support',
}

const ALL_USE_CASES: Record<string, string> = {
  coding: 'Coding & Development', 'content-creation': 'Content Creation',
  marketing: 'Marketing', design: 'Design', research: 'Research',
  video: 'Video', sales: 'Sales',
}

const INDUSTRY_AVG = 150

type Sub = {
  tool_id: string
  monthly_cost: number
  tools: {
    name: string; slug: string; logo_url: string | null
    category_id: string | null; use_case: string | null
    avg_rating: number; review_count: number; pricing_model: string
    tagline: string | null; has_api: boolean; is_open_source: boolean
  }
}

function score(rating: number, reviews: number) {
  return rating * Math.log2(reviews + 1)
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Single fetch for user's subs (widest select, used by everything) ──
  const { data: rawSubs } = await supabase.from('user_subscriptions')
    .select('tool_id, monthly_cost, tools:tool_id(name, slug, logo_url, category_id, use_case, avg_rating, review_count, pricing_model, tagline, has_api, is_open_source)')
    .eq('user_id', user.id)

  const subs = (rawSubs || []) as Sub[]
  if (subs.length < 2) return NextResponse.json({ dashboard: null })

  const totalMonthly = subs.reduce((s, sub) => s + Number(sub.monthly_cost), 0)
  const totalYearly = Math.round(totalMonthly * 12)

  // ── Identify usage-based (API/token) subscriptions to exclude from overlap ──
  const toolIds = subs.map(s => s.tool_id)
  const { data: usageTiers } = await supabase.from('tool_pricing_tiers')
    .select('tool_id, tier_name, monthly_price')
    .in('tool_id', toolIds)
  const usagePrices = new Map<string, Set<number>>()
  for (const t of usageTiers || []) {
    const lower = (t.tier_name || '').toLowerCase()
    if (lower.includes('api') || lower.includes('token')) {
      const set = usagePrices.get(t.tool_id) || new Set()
      set.add(t.monthly_price)
      usagePrices.set(t.tool_id, set)
    }
  }
  const isUsageBased = (sub: Sub) => usagePrices.get(sub.tool_id)?.has(Number(sub.monthly_cost)) ?? false

  // ── Single fetch for categories ──
  const catIds = [...new Set(subs.map(s => s.tools?.category_id).filter((id): id is string => id != null))]
  const { data: categories } = await supabase.from('categories').select('id, name').in('id', catIds.length > 0 ? catIds : ['none'])
  const catMap = new Map<string, string>()
  for (const cat of categories || []) catMap.set(cat.id, cat.name)

  // ── Group by category + use_case (tightest overlap detection) ──
  // Tools must share BOTH category AND use_case to be considered competing.
  // e.g. Grammarly (writing, content-creation) vs Jasper (writing, marketing)
  // are in the same category but serve different purposes — not overlap.
  // Exclude usage-based subs — pay-per-use doesn't compete with flat subscriptions.
  const catGroups = new Map<string, Sub[]>()
  for (const sub of subs) {
    if (isUsageBased(sub)) continue
    const catId = sub.tools?.category_id
    if (!catId) continue
    const useCase = sub.tools?.use_case || 'general'
    const groupKey = `${catId}::${useCase}`
    const list = catGroups.get(groupKey) || []
    list.push(sub)
    catGroups.set(groupKey, list)
  }

  // ═══ 1. STACK HEALTH SCORE ═══
  const overlapCount = Array.from(catGroups.values()).filter(c => c.length >= 2).reduce((s, items) => s + (items.length - 1), 0)
  const efficiencyScore = Math.max(0, 25 - (overlapCount * 8))

  const ratedTools = subs.filter(s => s.tools.avg_rating > 0 && s.tools.review_count > 0)
  const avgRating = ratedTools.length > 0
    ? ratedTools.reduce((s, t) => s + t.tools.avg_rating, 0) / ratedTools.length : 3.5
  const qualityScore = Math.round((avgRating / 5) * 25)

  const coveredUseCases = new Set(subs.map(s => s.tools?.use_case).filter(Boolean))
  const coverageScore = Math.round(Math.min(coveredUseCases.size / 4, 1) * 25)

  const costPerUseCase = coveredUseCases.size > 0 ? totalMonthly / coveredUseCases.size : totalMonthly
  const valueScore = Math.round(Math.max(0, Math.min(25, 25 - (costPerUseCase - 30) * 0.25)))

  const stackScore = {
    total: efficiencyScore + qualityScore + coverageScore + valueScore,
    efficiency: { score: efficiencyScore, max: 25, label: overlapCount === 0 ? 'No overlap' : `${overlapCount} overlap${overlapCount > 1 ? 's' : ''}` },
    quality: { score: qualityScore, max: 25, label: `Avg ${avgRating.toFixed(1)} stars` },
    coverage: { score: coverageScore, max: 25, label: `${coveredUseCases.size} use case${coveredUseCases.size !== 1 ? 's' : ''}` },
    value: { score: valueScore, max: 25, label: `$${Math.round(costPerUseCase)}/use case` },
  }

  // ═══ 2. CATEGORY SPEND ═══
  const categorySpend: { name: string; amount: number; percent: number; toolCount: number }[] = []
  const spendByCat = new Map<string, { amount: number; count: number }>()
  for (const sub of subs) {
    const catName = sub.tools?.category_id ? catMap.get(sub.tools.category_id) || 'Other' : 'Other'
    const existing = spendByCat.get(catName) || { amount: 0, count: 0 }
    existing.amount += Number(sub.monthly_cost)
    existing.count++
    spendByCat.set(catName, existing)
  }
  for (const [name, { amount, count }] of spendByCat.entries()) {
    categorySpend.push({ name, amount: Math.round(amount), percent: totalMonthly > 0 ? Math.round((amount / totalMonthly) * 100) : 0, toolCount: count })
  }
  categorySpend.sort((a, b) => b.amount - a.amount)

  // ═══ 3. OVERLAPS (with ratings) ═══
  const overlaps = Array.from(catGroups.entries())
    .filter(([, items]) => items.length >= 2)
    .map(([groupKey, items]) => {
      const [actualCatId, groupUseCase] = groupKey.split('::')
      const useCaseLabel = groupUseCase && groupUseCase !== 'general'
        ? (USE_CASE_LABELS[groupUseCase] || groupUseCase)
        : null
      const label = useCaseLabel || catMap.get(actualCatId) || 'Similar Tools'

      const scored = items.map(s => ({
        name: s.tools?.name || '?', slug: s.tools?.slug || '', logo_url: s.tools?.logo_url,
        cost: Number(s.monthly_cost), rating: s.tools?.avg_rating || 0,
        reviews: s.tools?.review_count || 0,
        sc: score(s.tools?.avg_rating || 0, s.tools?.review_count || 0),
      })).sort((a, b) => b.sc - a.sc)

      const topPick = scored[0]
      const totalCost = scored.reduce((s, t) => s + t.cost, 0)
      return {
        label, tools: scored, topPick: topPick.name, topPickSlug: topPick.slug,
        totalCost, savingsIfKeepBest: Math.round((totalCost - topPick.cost) * 12),
      }
    })
    .filter(o => o.savingsIfKeepBest > 0)
    .sort((a, b) => b.savingsIfKeepBest - a.savingsIfKeepBest)

  // ═══ 4. PREMIUM OVERLAP ═══
  const allToolIds = subs.map(s => s.tool_id)
  const { data: allTiers } = await supabase.from('tool_pricing_tiers')
    .select('tool_id, tier_name, monthly_price')
    .in('tool_id', allToolIds)
    .gt('monthly_price', 0)
    .order('monthly_price', { ascending: true })

  const cheapestTierByTool = new Map<string, { name: string; price: number }>()
  if (allTiers) {
    for (const t of allTiers) {
      if (!cheapestTierByTool.has(t.tool_id)) cheapestTierByTool.set(t.tool_id, { name: t.tier_name, price: t.monthly_price })
    }
  }

  const premiumOverlaps: { label: string; tools: { name: string; slug: string; cost: number; cheapestTier: string; cheapestCost: number }[]; totalCost: number; savingsIfDowngradeRest: number }[] = []
  for (const [groupKey, items] of catGroups.entries()) {
    if (items.length < 2) continue
    const premiumItems = items.filter(s => {
      const cheapest = cheapestTierByTool.get(s.tool_id)
      return cheapest && Number(s.monthly_cost) > cheapest.price * 1.3
    })
    if (premiumItems.length >= 2) {
      premiumItems.sort((a, b) => Number(b.monthly_cost) - Number(a.monthly_cost))
      const downgradeTargets = premiumItems.slice(1)
      const savingsIfDowngradeRest = downgradeTargets.reduce((s, t) => {
        const ch = cheapestTierByTool.get(t.tool_id)
        return s + (ch ? Math.round((Number(t.monthly_cost) - ch.price) * 12) : 0)
      }, 0)
      if (savingsIfDowngradeRest > 0) {
        const [actualCatId2, groupUseCase2] = groupKey.split('::')
        const ucLabel = groupUseCase2 && groupUseCase2 !== 'general' ? (USE_CASE_LABELS[groupUseCase2] || groupUseCase2) : null
        const label = ucLabel || catMap.get(actualCatId2) || 'Similar Tools'
        premiumOverlaps.push({
          label: label as string,
          tools: premiumItems.map(t => ({ name: t.tools.name, slug: t.tools.slug, cost: Number(t.monthly_cost), cheapestTier: cheapestTierByTool.get(t.tool_id)?.name || '?', cheapestCost: cheapestTierByTool.get(t.tool_id)?.price || 0 })),
          totalCost: premiumItems.reduce((s, t) => s + Number(t.monthly_cost), 0),
          savingsIfDowngradeRest,
        })
      }
    }
  }

  // ═══ 5. BENCHMARK (exclude current user) ═══
  const { data: benchmarkSubs } = await supabase.from('user_subscriptions')
    .select('user_id, monthly_cost, tool_id')

  let avgMonthly = INDUSTRY_AVG
  let percentile = 50
  let isIndustryBenchmark = true

  if (benchmarkSubs && benchmarkSubs.length > 0) {
    const userTotals = new Map<string, number>()
    for (const s of benchmarkSubs) {
      userTotals.set(s.user_id, (userTotals.get(s.user_id) || 0) + Number(s.monthly_cost))
    }
    const otherTotals = Array.from(userTotals.entries())
      .filter(([id]) => id !== user.id)
      .map(([, total]) => total)
      .sort((a, b) => a - b)

    if (otherTotals.length >= 5) {
      avgMonthly = Math.round(otherTotals.reduce((s, v) => s + v, 0) / otherTotals.length)
      percentile = Math.round((otherTotals.filter(t => t < totalMonthly).length / otherTotals.length) * 100)
      isIndustryBenchmark = false
    } else {
      percentile = totalMonthly > INDUSTRY_AVG ? 65 : totalMonthly < INDUSTRY_AVG * 0.5 ? 25 : 50
    }
  }

  // ═══ 6. MISSING USE CASES ═══
  const userUseCases = new Set(subs.map(s => s.tools?.use_case).filter(Boolean))
  const missingUseCases: { useCase: string; label: string; topTool: { name: string; slug: string; logo_url: string | null; avg_rating: number; review_count: number; cheapest_price: number } | null }[] = []

  for (const [uc, label] of Object.entries(ALL_USE_CASES)) {
    if (userUseCases.has(uc)) continue
    const { data: topInCategory } = await supabase
      .from('tools').select('id, name, slug, logo_url, avg_rating, review_count')
      .eq('status', 'published').eq('use_case', uc).gte('review_count', 3)
      .order('avg_rating', { ascending: false }).limit(1)

    if (topInCategory?.[0]) {
      const t = topInCategory[0]
      const { data: tierData } = await supabase.from('tool_pricing_tiers')
        .select('monthly_price').eq('tool_id', t.id).gt('monthly_price', 0)
        .order('monthly_price', { ascending: true }).limit(1)
      missingUseCases.push({ useCase: uc, label, topTool: { ...t, cheapest_price: tierData?.[0]?.monthly_price || 0 } })
    }
  }

  // ═══ 7. PEOPLE ALSO USE ═══
  const userToolIds = new Set(subs.map(s => s.tool_id))
  const alsoUse: { name: string; slug: string; logo_url: string | null; percent: number }[] = []

  if (benchmarkSubs && benchmarkSubs.length > 0) {
    const usersWithSharedTools = new Set<string>()
    for (const cs of benchmarkSubs) {
      if (cs.user_id !== user.id && userToolIds.has(cs.tool_id)) usersWithSharedTools.add(cs.user_id)
    }
    if (usersWithSharedTools.size > 0) {
      const toolPopularity = new Map<string, number>()
      for (const cs of benchmarkSubs) {
        if (usersWithSharedTools.has(cs.user_id) && !userToolIds.has(cs.tool_id)) {
          toolPopularity.set(cs.tool_id, (toolPopularity.get(cs.tool_id) || 0) + 1)
        }
      }
      const topToolIds = Array.from(toolPopularity.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4)
      if (topToolIds.length > 0) {
        const { data: toolDetails } = await supabase.from('tools').select('id, name, slug, logo_url')
          .in('id', topToolIds.map(t => t[0])).eq('status', 'published')
        for (const [id, count] of topToolIds) {
          const detail = toolDetails?.find(t => t.id === id)
          if (detail) alsoUse.push({ name: detail.name, slug: detail.slug, logo_url: detail.logo_url, percent: Math.round((count / usersWithSharedTools.size) * 100) })
        }
      }
    }
  }

  // ═══ 8. TEAM COSTS ═══
  const teamCosts = [1, 3, 5, 10].map(size => ({ size, monthly: Math.round(totalMonthly * size), yearly: Math.round(totalMonthly * size * 12) }))

  // ═══ 9. SAVINGS + VERDICT ═══
  const overlapSavings = overlaps.reduce((s, o) => s + o.savingsIfKeepBest, 0)
  const premiumSavings = premiumOverlaps.reduce((s, p) => s + p.savingsIfDowngradeRest, 0)
  const totalPotentialSavings = overlapSavings + premiumSavings

  let verdict = ''
  if (totalPotentialSavings === 0) verdict = 'Your stack looks lean. No obvious waste detected.'
  else if (totalPotentialSavings < 200) verdict = `Minor optimization possible. You could save ~$${totalPotentialSavings}/year.`
  else if (totalPotentialSavings < 1000) verdict = `Real savings available. Consolidating overlaps could save you $${totalPotentialSavings}/year.`
  else verdict = `Significant waste detected. You could save $${totalPotentialSavings}/year — that's $${Math.round(totalPotentialSavings / 12)}/month back in your pocket.`

  // ═══ 10. ANALYSIS TEXT ═══
  const analysisParagraphs: string[] = []
  const paidCount = subs.filter(s => Number(s.monthly_cost) > 0).length
  const freeCount = subs.length - paidCount
  analysisParagraphs.push(`You're spending $${Math.round(totalMonthly)}/mo ($${totalYearly}/yr) across ${subs.length} AI tools${freeCount > 0 ? ` (${paidCount} paid, ${freeCount} free)` : ''}.`)

  const overlapGroups = Array.from(catGroups.entries()).filter(([, items]) => items.length >= 2)
  if (overlapGroups.length > 0) {
    const lines: string[] = []
    for (const [groupKey, items] of overlapGroups) {
      const [aCatId, aUseCase] = groupKey.split('::')
      const catName = (aUseCase && aUseCase !== 'general' ? (USE_CASE_LABELS[aUseCase] || aUseCase) : null) || catMap.get(aCatId) || 'Unknown'
      const names = items.map(s => s.tools.name)
      const totalCatCost = items.reduce((s, i) => s + Number(i.monthly_cost), 0)
      const scored2 = items.map(s => ({ name: s.tools.name, rating: s.tools.avg_rating, reviews: s.tools.review_count, cost: Number(s.monthly_cost) })).sort((a, b) => score(b.rating, b.reviews) - score(a.rating, a.reviews))
      const best = scored2[0]
      const rest = scored2.slice(1)
      if (rest.every(r => r.cost === 0)) {
        lines.push(`${catName}: ${names.join(' and ')} overlap, but ${rest.map(r => r.name).join(', ')} ${rest.length === 1 ? 'is' : 'are'} free — no money wasted.`)
      } else {
        const wasteCost = rest.filter(r => r.cost > 0).reduce((s, r) => s + r.cost, 0)
        lines.push(`${catName}: You're paying for ${names.join(', ')} ($${totalCatCost}/mo). ${best.name} is highest-rated (${best.rating.toFixed(1)}★). Dropping the rest saves $${wasteCost * 12}/yr.`)
      }
    }
    analysisParagraphs.push(lines.join(' '))
  } else {
    analysisParagraphs.push('No overlap detected — each tool serves a different purpose.')
  }

  if (totalPotentialSavings > 0) {
    analysisParagraphs.push(`Verdict: Consolidating overlaps saves $${totalPotentialSavings}/yr. Compare overlapping tools side-by-side and keep the one you prefer.`)
  } else {
    analysisParagraphs.push('Verdict: Your stack is lean. No cuts needed.')
  }

  return NextResponse.json({
    dashboard: {
      totalMonthly: Math.round(totalMonthly),
      totalYearly,
      toolCount: subs.length,
      stackScore,
      categorySpend,
      overlaps,
      premiumOverlaps,
      benchmark: { avgMonthly, percentile, isIndustryBenchmark },
      totalPotentialSavings,
      missingUseCases,
      alsoUse,
      teamCosts,
      verdict,
      analysis: analysisParagraphs.join('\n\n'),
    },
  })
}
