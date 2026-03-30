import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

/*
 * Stack Score v2 — "Maximum value for minimum waste"
 *
 * Dimensions:
 *   Efficiency  (30%) — Are you overpaying relative to what each tool costs most people?
 *   Redundancy  (25%) — Are you double-paying for overlapping functionality?
 *   Quality     (20%) — Are your tools well-reviewed and established?
 *   Utilization (15%) — Are you using what you pay for? (check-in data)
 *   Balance     (10%) — Is your spend dangerously concentrated on one tool?
 */

type SubRow = {
  tool_id: string
  monthly_cost: number
  use_tags: string[] | null
  tools: {
    name: string
    slug: string
    pricing_model: string
    use_case: string | null
    use_cases: string[] | null
    category_id: string | null
    avg_rating: number | null
    review_count: number | null
    categories: { name: string } | null
  } | null
}

type TierRow = {
  tool_id: string
  monthly_price: number
}

function getGrade(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function qualityScore(rating: number | null, reviews: number | null): number {
  const r = rating ?? 0
  const n = reviews ?? 0
  if (n === 0) return 0
  return r * Math.log2(n + 1)
}

export async function GET(request: Request) {
  const ip = getClientIp(request)
  const { success } = rateLimit(`tracker:score:get:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: subs, error } = await supabase
    .from('user_subscriptions')
    .select('tool_id, monthly_cost, use_tags, tools:tool_id(name, slug, pricing_model, use_case, use_cases, category_id, avg_rating, review_count, categories:category_id(name))')
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!subs || subs.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 subscriptions' }, { status: 400 })
  }

  const typedSubs = subs as unknown as SubRow[]
  const toolIds = typedSubs.map(s => s.tool_id)
  const totalSpend = typedSubs.reduce((sum, s) => sum + Number(s.monthly_cost), 0)

  // ── 1. Efficiency (30%) — compare user's cost to median price for each tool ──
  const { data: allTiers } = await admin
    .from('tool_pricing_tiers')
    .select('tool_id, monthly_price')
    .in('tool_id', toolIds)
    .gt('monthly_price', 0) as { data: TierRow[] | null }

  const medianPriceByTool = new Map<string, number>()
  if (allTiers) {
    const grouped = new Map<string, number[]>()
    for (const t of allTiers) {
      if (!grouped.has(t.tool_id)) grouped.set(t.tool_id, [])
      grouped.get(t.tool_id)!.push(t.monthly_price)
    }
    for (const [tid, prices] of grouped) {
      prices.sort((a, b) => a - b)
      const mid = Math.floor(prices.length / 2)
      medianPriceByTool.set(tid, prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2)
    }
  }

  let efficiencyTotal = 0
  let efficiencyCount = 0
  const overpayingTools: { name: string; slug: string; paying: number; median: number }[] = []

  for (const sub of typedSubs) {
    const cost = Number(sub.monthly_cost)
    if (cost === 0) { efficiencyTotal += 100; efficiencyCount++; continue }

    const median = medianPriceByTool.get(sub.tool_id)
    if (!median) {
      // No tier data — give neutral score
      efficiencyTotal += 70
      efficiencyCount++
      continue
    }

    const ratio = cost / median
    let toolEff: number
    if (ratio <= 0.8) toolEff = 100       // paying below median — great deal
    else if (ratio <= 1.0) toolEff = 90   // at or near median — fine
    else if (ratio <= 1.3) toolEff = 70   // slightly above median
    else if (ratio <= 1.8) toolEff = 50   // overpaying
    else toolEff = 30                      // significantly overpaying

    if (ratio > 1.3 && sub.tools?.name) {
      overpayingTools.push({
        name: sub.tools.name,
        slug: sub.tools.slug,
        paying: cost,
        median: Math.round(median),
      })
    }

    efficiencyTotal += toolEff
    efficiencyCount++
  }

  const efficiencyScore = efficiencyCount > 0 ? Math.round(efficiencyTotal / efficiencyCount) : 70

  // ── 2. Redundancy (25%) — flag genuinely overlapping functionality ──
  const redundantPairs: { toolA: string; toolB: string; reason: string; wastedCost: number }[] = []

  for (let i = 0; i < typedSubs.length; i++) {
    for (let j = i + 1; j < typedSubs.length; j++) {
      const a = typedSubs[i]
      const b = typedSubs[j]
      if (!a.tools || !b.tools) continue

      // Check use_cases array overlap (strongest signal)
      const aUseCases = a.tools.use_cases || (a.tools.use_case ? [a.tools.use_case] : [])
      const bUseCases = b.tools.use_cases || (b.tools.use_case ? [b.tools.use_case] : [])
      const shared = aUseCases.filter(uc => bUseCases.includes(uc))

      if (shared.length === 0) continue

      // Only flag if same category too (same category + shared use cases = real overlap)
      if (a.tools.category_id && a.tools.category_id === b.tools.category_id) {
        const cheaper = Math.min(Number(a.monthly_cost), Number(b.monthly_cost))
        redundantPairs.push({
          toolA: a.tools.name,
          toolB: b.tools.name,
          reason: `Both do ${shared.slice(0, 2).join(' and ')}`,
          wastedCost: cheaper, // the cheaper one is the "waste"
        })
      }
    }
  }

  const totalWaste = redundantPairs.reduce((s, p) => s + p.wastedCost, 0)
  const wasteRatio = totalSpend > 0 ? totalWaste / totalSpend : 0
  let redundancyScore: number
  if (redundantPairs.length === 0) redundancyScore = 100
  else if (wasteRatio < 0.1) redundancyScore = 85
  else if (wasteRatio < 0.2) redundancyScore = 70
  else if (wasteRatio < 0.35) redundancyScore = 50
  else redundancyScore = 30

  // ── 3. Quality (20%) — are the tools well-reviewed? ──
  const maxPossibleQuality = 5 * Math.log2(1001) // 5-star tool with 1000 reviews ≈ 50
  let qualityTotal = 0

  for (const sub of typedSubs) {
    const qs = qualityScore(sub.tools?.avg_rating ?? null, sub.tools?.review_count ?? null)
    qualityTotal += qs
  }

  const avgQuality = typedSubs.length > 0 ? qualityTotal / typedSubs.length : 0
  // Normalize: a "good" average quality score is ~20 (4 stars, ~30 reviews)
  const qualityNormalized = Math.min(100, Math.round((avgQuality / 20) * 100))

  // ── 4. Utilization (15%) — check-in data ──
  const twelveWeeksAgo = new Date(Date.now() - 84 * 86400000).toISOString()
  const { data: checkins } = await admin
    .from('usage_checkins')
    .select('tool_id, week_start, used')
    .eq('user_id', user.id)
    .gte('week_start', twelveWeeksAgo)

  let utilizationScore: number
  const unusedTools: { name: string; cost: number }[] = []

  if (!checkins || checkins.length === 0) {
    // No check-in data — benefit of the doubt, neutral score
    utilizationScore = 70
  } else {
    const usageByTool = new Map<string, { tracked: number; used: number }>()
    for (const c of checkins) {
      if (!usageByTool.has(c.tool_id)) usageByTool.set(c.tool_id, { tracked: 0, used: 0 })
      const entry = usageByTool.get(c.tool_id)!
      entry.tracked++
      if (c.used) entry.used++
    }

    let utilTotal = 0
    let utilCount = 0
    for (const sub of typedSubs) {
      const usage = usageByTool.get(sub.tool_id)
      if (!usage || usage.tracked < 2) continue // not enough data for this tool
      const rate = usage.used / usage.tracked
      utilTotal += rate * 100
      utilCount++
      if (rate < 0.25 && Number(sub.monthly_cost) > 10 && sub.tools) {
        unusedTools.push({ name: sub.tools.name, cost: Number(sub.monthly_cost) })
      }
    }

    if (utilCount === 0) {
      utilizationScore = 70
    } else {
      utilizationScore = Math.round(utilTotal / utilCount)
    }
  }

  // ── 5. Balance (10%) — is spend concentrated on one tool? ──
  let balanceScore = 100
  if (totalSpend > 0) {
    const maxToolSpend = Math.max(...typedSubs.map(s => Number(s.monthly_cost)))
    const concentration = maxToolSpend / totalSpend
    if (concentration > 0.7) balanceScore = 40
    else if (concentration > 0.5) balanceScore = 65
    else if (concentration > 0.4) balanceScore = 80
    else balanceScore = 100
  }

  // ── Composite score ──
  const composite = Math.round(
    efficiencyScore * 0.30 +
    redundancyScore * 0.25 +
    qualityNormalized * 0.20 +
    utilizationScore * 0.15 +
    balanceScore * 0.10
  )
  const finalScore = Math.max(0, Math.min(100, composite))

  // ── Generate specific, actionable tips ──
  const tips: string[] = []

  // Overpaying tips (most actionable)
  for (const tool of overpayingTools.slice(0, 2)) {
    tips.push(
      `You pay $${tool.paying}/mo for ${tool.name} — most users pay around $${tool.median}/mo. Check if you can downgrade tiers.`
    )
  }

  // Redundancy tips
  for (const pair of redundantPairs.slice(0, 2)) {
    tips.push(
      `${pair.toolA} and ${pair.toolB} overlap (${pair.reason}). Dropping one saves ~$${pair.wastedCost}/mo.`
    )
  }

  // Unused tool tips
  for (const tool of unusedTools.slice(0, 2)) {
    tips.push(
      `You barely use ${tool.name} but pay $${tool.cost}/mo. Cancel or switch to a free tier.`
    )
  }

  // Balance tip
  if (balanceScore < 65) {
    const topTool = typedSubs.reduce((max, s) =>
      Number(s.monthly_cost) > Number(max.monthly_cost) ? s : max
    )
    if (topTool.tools) {
      const pct = Math.round((Number(topTool.monthly_cost) / totalSpend) * 100)
      tips.push(
        `${topTool.tools.name} is ${pct}% of your total spend. If they raise prices, it'll hurt.`
      )
    }
  }

  // Cap at 3 tips, never show filler
  const finalTips = tips.slice(0, 3)

  return NextResponse.json({
    score: finalScore,
    grade: getGrade(finalScore),
    breakdown: {
      efficiency: efficiencyScore,
      redundancy: redundancyScore,
      quality: qualityNormalized,
      utilization: utilizationScore,
      balance: balanceScore,
    },
    tips: finalTips,
  })
}
