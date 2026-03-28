import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'



type Sub = {
  tool_id: string
  monthly_cost: number
  tools: {
    name: string; slug: string; logo_url: string | null
    category_id: string | null; use_case: string | null
    avg_rating: number; review_count: number; pricing_model: string
  }
}

const USE_CASE_LABELS: Record<string, string> = {
  coding: 'Coding', 'content-creation': 'Content', marketing: 'Marketing',
  design: 'Design', research: 'Research', video: 'Video', sales: 'Sales',
  'customer-support': 'Support',
}

const ALL_USE_CASES = Object.keys(USE_CASE_LABELS)

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: rawSubs } = await supabase.from('user_subscriptions')
    .select('tool_id, monthly_cost, tools:tool_id(name, slug, logo_url, category_id, use_case, avg_rating, review_count, pricing_model)')
    .eq('user_id', user.id)

  const subs = (rawSubs || []) as Sub[]
  if (subs.length === 0) return NextResponse.json({ intel: null })

  const totalMonthly = subs.reduce((s, sub) => s + Number(sub.monthly_cost), 0)

  // Get category names
  const catIds = [...new Set(subs.map(s => s.tools?.category_id).filter((id): id is string => id != null))]
  const { data: categories } = await supabase.from('categories').select('id, name').in('id', catIds.length > 0 ? catIds : ['none'])
  const catMap = new Map<string, string>()
  for (const cat of categories || []) catMap.set(cat.id, cat.name)

  // ═══ 1. STACK HEALTH SCORE ═══
  // Efficiency (0-25): penalize overlap
  const catGroupCounts = new Map<string, number>()
  for (const sub of subs) {
    const catId = sub.tools?.category_id
    if (!catId) continue
    const useCase = sub.tools?.use_case || 'general'
    const groupKey = `${catId}::${useCase}`
    catGroupCounts.set(groupKey, (catGroupCounts.get(groupKey) || 0) + 1)
  }
  const overlapCount = Array.from(catGroupCounts.values()).filter(c => c >= 2).reduce((s, c) => s + (c - 1), 0)
  const efficiencyScore = Math.max(0, 25 - (overlapCount * 8))

  // Quality (0-25): avg rating of tools weighted by reviews
  const ratedTools = subs.filter(s => s.tools.avg_rating > 0 && s.tools.review_count > 0)
  const avgRating = ratedTools.length > 0
    ? ratedTools.reduce((s, t) => s + t.tools.avg_rating, 0) / ratedTools.length
    : 3.5
  const qualityScore = Math.round((avgRating / 5) * 25)

  // Coverage (0-25): how many use_cases covered
  const coveredUseCases = new Set(subs.map(s => s.tools?.use_case).filter(Boolean))
  const coverageRatio = Math.min(coveredUseCases.size / 4, 1) // 4+ use_cases = full marks
  const coverageScore = Math.round(coverageRatio * 25)

  // Value (0-25): lower cost per use_case = better
  const costPerUseCase = coveredUseCases.size > 0 ? totalMonthly / coveredUseCases.size : totalMonthly
  // $0-30 per use_case = great, $100+ = bad
  const valueScore = Math.round(Math.max(0, Math.min(25, 25 - (costPerUseCase - 30) * 0.25)))

  const totalScore = efficiencyScore + qualityScore + coverageScore + valueScore

  const scoreBreakdown = {
    total: totalScore,
    efficiency: { score: efficiencyScore, max: 25, label: overlapCount === 0 ? 'No overlap' : `${overlapCount} overlap${overlapCount > 1 ? 's' : ''}` },
    quality: { score: qualityScore, max: 25, label: `Avg ${avgRating.toFixed(1)} stars` },
    coverage: { score: coverageScore, max: 25, label: `${coveredUseCases.size} use case${coveredUseCases.size !== 1 ? 's' : ''}` },
    value: { score: valueScore, max: 25, label: `$${Math.round(costPerUseCase)}/use case` },
  }

  // ═══ 2. CATEGORY SPEND BREAKDOWN ═══
  const categorySpend: { name: string; amount: number; percent: number; toolCount: number }[] = []
  const spendByCat = new Map<string, { amount: number; count: number }>()
  for (const sub of subs) {
    const catId = sub.tools?.category_id
    const catName = catId ? catMap.get(catId) || 'Other' : 'Other'
    const existing = spendByCat.get(catName) || { amount: 0, count: 0 }
    existing.amount += Number(sub.monthly_cost)
    existing.count++
    spendByCat.set(catName, existing)
  }
  for (const [name, { amount, count }] of spendByCat.entries()) {
    categorySpend.push({
      name,
      amount: Math.round(amount),
      percent: totalMonthly > 0 ? Math.round((amount / totalMonthly) * 100) : 0,
      toolCount: count,
    })
  }
  categorySpend.sort((a, b) => b.amount - a.amount)

  // ═══ 3. ANNUAL BILLING SAVINGS ═══
  const annualSavings: { toolName: string; toolSlug: string; monthlyPrice: number; annualMonthly: number; savingsPerYear: number }[] = []
  for (const sub of subs) {
    const cost = Number(sub.monthly_cost)
    if (cost === 0) continue

    const { data: tiers } = await supabase.from('tool_pricing_tiers')
      .select('tier_name, monthly_price, features')
      .eq('tool_id', sub.tool_id)
      .order('monthly_price', { ascending: true })

    if (!tiers) continue

    // Look for annual tiers (features or name mentions "annual", "yearly", "billed annually")
    for (const tier of tiers) {
      const isAnnual = /annual|yearly|billed annually|per year|\/yr/i.test((tier.features || '') + ' ' + tier.tier_name)
      if (isAnnual && tier.monthly_price < cost && tier.monthly_price > 0) {
        annualSavings.push({
          toolName: sub.tools.name,
          toolSlug: sub.tools.slug,
          monthlyPrice: cost,
          annualMonthly: tier.monthly_price,
          savingsPerYear: Math.round((cost - tier.monthly_price) * 12),
        })
        break
      }
    }
  }
  annualSavings.sort((a, b) => b.savingsPerYear - a.savingsPerYear)

  // ═══ 4. PEOPLE ALSO USE (collaborative filtering) ═══
  const userToolIds = new Set(subs.map(s => s.tool_id))
  const { data: coSubs } = await supabase.from('user_subscriptions')
    .select('user_id, tool_id')

  const alsoUse: { name: string; slug: string; logo_url: string | null; pairCount: number; totalUsers: number; percent: number }[] = []

  if (coSubs && coSubs.length > 0) {
    // Find users who share at least one tool with current user
    const usersWithSharedTools = new Set<string>()
    for (const cs of coSubs) {
      if (cs.user_id !== user.id && userToolIds.has(cs.tool_id)) {
        usersWithSharedTools.add(cs.user_id)
      }
    }

    if (usersWithSharedTools.size > 0) {
      // Count how many of those users also have tools the current user doesn't
      const toolPopularity = new Map<string, number>()
      for (const cs of coSubs) {
        if (usersWithSharedTools.has(cs.user_id) && !userToolIds.has(cs.tool_id)) {
          toolPopularity.set(cs.tool_id, (toolPopularity.get(cs.tool_id) || 0) + 1)
        }
      }

      // Get top 4 most common tools among similar users
      const topToolIds = Array.from(toolPopularity.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([id, count]) => ({ id, count }))

      if (topToolIds.length > 0) {
        const { data: toolDetails } = await supabase
          .from('tools')
          .select('id, name, slug, logo_url')
          .in('id', topToolIds.map(t => t.id))
          .eq('status', 'published')

        const totalSimilar = usersWithSharedTools.size
        for (const tt of topToolIds) {
          const detail = toolDetails?.find(t => t.id === tt.id)
          if (detail) {
            alsoUse.push({
              name: detail.name,
              slug: detail.slug,
              logo_url: detail.logo_url,
              pairCount: tt.count,
              totalUsers: totalSimilar,
              percent: Math.round((tt.count / totalSimilar) * 100),
            })
          }
        }
      }
    }
  }

  // ═══ 5. TEAM COST MULTIPLIER ═══
  const teamCosts = [
    { size: 1, monthly: Math.round(totalMonthly), yearly: Math.round(totalMonthly * 12) },
    { size: 3, monthly: Math.round(totalMonthly * 3), yearly: Math.round(totalMonthly * 3 * 12) },
    { size: 5, monthly: Math.round(totalMonthly * 5), yearly: Math.round(totalMonthly * 5 * 12) },
    { size: 10, monthly: Math.round(totalMonthly * 10), yearly: Math.round(totalMonthly * 10 * 12) },
  ]

  return NextResponse.json({
    intel: {
      score: scoreBreakdown,
      categorySpend,
      annualSavings,
      alsoUse,
      teamCosts,
    },
  })
}
