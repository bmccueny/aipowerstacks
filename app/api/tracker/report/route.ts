import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { callClaude } from '@/lib/utils/anthropic'

export const maxDuration = 45

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
    tagline: string | null
    description: string | null
    category_id: string | null
    use_case: string | null
    use_cases: string[] | null
    is_supertools: boolean | null
    avg_rating: number
    review_count: number
  }
}

type AIOverlapGroup = {
  label: string
  confidence: number
  shared_capabilities: string[]
  tools: Array<{
    slug: string
    unique_value: string
    keep_reason: string | null
    verdict: 'keep' | 'consider_dropping' | 'downgrade'
  }>
  recommended_keep: string
  savings_reasoning: string
}

type AIAnalysis = {
  overlap_groups: AIOverlapGroup[]
  stack_efficiency: number
  overall_verdict: string
}

async function analyzeWithAI(toolContext: Array<{
  name: string
  slug: string
  tagline: string | null
  description: string | null
  use_case: string | null
  use_cases: string[] | null
  monthly_cost: number
  rating: number
  reviews: number
}>): Promise<AIAnalysis | null> {
  try {
    const result = await callClaude({
      messages: [{
        role: 'user',
        content: `You are an expert AI tool analyst. Analyze this user's AI tool subscriptions for capability overlap. Your analysis must be precise — only flag REAL overlaps where tools genuinely compete for the same job.

USER'S TOOLS:
${toolContext.map(t => `- ${t.name} (${t.slug}): ${t.tagline || 'No description'}
  Use case: ${t.use_case || 'general'} | Use cases: ${(t.use_cases || []).join(', ') || 'none'}
  Cost: $${t.monthly_cost}/mo | Rating: ${t.rating}/5 (${t.reviews} reviews)
  ${t.description ? `Description: ${t.description.slice(0, 200)}` : ''}`).join('\n\n')}

ANALYSIS RULES:
1. Two tools overlap ONLY if they can largely replace each other for the SAME specific job
2. Tools in different categories CAN overlap (e.g., ChatGPT and Gemini are in different categories but compete directly)
3. Complementary tools do NOT overlap (e.g., an IDE and a deployment tool)
4. A general-purpose AI (ChatGPT) overlaps with a specialized tool ONLY for that specialty
5. Rate confidence 0-100: how much capability overlap exists between the tools
6. For each tool in an overlap group, identify what UNIQUE value it provides that others don't
7. The "keep" recommendation should favor: highest rated > most reviews > lowest cost

Respond with ONLY this JSON (no markdown, no backticks):
{
  "overlap_groups": [
    {
      "label": "Descriptive group name (e.g., 'AI Code Assistants', 'General-Purpose Chat')",
      "confidence": 85,
      "shared_capabilities": ["capability 1 they share", "capability 2"],
      "tools": [
        {
          "slug": "tool-slug",
          "unique_value": "What this tool does that others in the group don't",
          "keep_reason": "Why to keep this one (null if recommending to drop)",
          "verdict": "keep"
        },
        {
          "slug": "other-tool-slug",
          "unique_value": "Its unique strength",
          "keep_reason": null,
          "verdict": "consider_dropping"
        }
      ],
      "recommended_keep": "tool-slug",
      "savings_reasoning": "Why dropping the other saves money without losing much"
    }
  ],
  "stack_efficiency": 7,
  "overall_verdict": "One sentence summary of the stack's efficiency"
}

IMPORTANT:
- Only include groups with 2+ tools that genuinely overlap
- confidence must be 50-100 (below 50 = not a real overlap, don't include)
- If no overlaps exist, return empty overlap_groups with efficiency 10
- Be honest about unique value — if a tool truly offers something irreplaceable, say so`
      }],
      maxTokens: 1200,
      temperature: 0.3,
      model: 'claude-haiku-4-5-20251001',
    })

    const jsonMatch = result.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0]) as AIAnalysis
    if (!parsed.overlap_groups || !Array.isArray(parsed.overlap_groups)) return null
    return parsed
  } catch {
    return null
  }
}

function fallbackOverlaps(subs: Sub[], catNameMap: Map<string, string>) {
  const categoryGroups = new Map<string, Sub[]>()
  for (const sub of subs) {
    if (sub.tools?.is_supertools) continue
    const catId = sub.tools?.category_id
    if (!catId) continue
    const useCase = sub.tools?.use_case || 'general'
    const groupKey = `${catId}::${useCase}`
    const list = categoryGroups.get(groupKey) || []
    list.push(sub)
    categoryGroups.set(groupKey, list)
  }

  return Array.from(categoryGroups.entries())
    .filter(([, items]) => items.length >= 2)
    .map(([groupKey, items]) => {
      const [actualCatId, groupUseCase] = groupKey.split('::')
      const label = groupUseCase && groupUseCase !== 'general'
        ? (USE_CASE_LABELS[groupUseCase] || groupUseCase)
        : (catNameMap.get(actualCatId) || 'Similar Tools')

      const scored = items.map(s => {
        const rating = s.tools?.avg_rating || 0
        const reviews = s.tools?.review_count || 0
        return {
          name: s.tools?.name || '?',
          slug: s.tools?.slug || '',
          logo_url: s.tools?.logo_url,
          cost: Number(s.monthly_cost),
          rating,
          reviews,
          score: rating * Math.log2(reviews + 1),
        }
      }).sort((a, b) => b.score - a.score)

      const topPick = scored[0]
      const totalCost = scored.reduce((s, t) => s + t.cost, 0)
      const savingsIfKeepBest = Math.round((totalCost - topPick.cost) * 12)

      return {
        label,
        confidence: 70,
        shared_capabilities: [],
        tools: scored.map((s, i) => ({
          ...s,
          unique_value: '',
          verdict: i === 0 ? 'keep' as const : 'consider_dropping' as const,
        })),
        topPick: topPick.name,
        topPickSlug: topPick.slug,
        totalCost,
        savingsIfKeepBest,
        savings_reasoning: '',
      }
    })
    .filter(o => o.savingsIfKeepBest > 0)
    .sort((a, b) => b.savingsIfKeepBest - a.savingsIfKeepBest)
}

export async function GET(request: Request) {
  const ip = getClientIp(request)
  const { success } = rateLimit(`tracker:report:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: rawSubs } = await supabase.from('user_subscriptions')
    .select('tool_id, monthly_cost, tools:tool_id(name, slug, logo_url, tagline, description, category_id, use_case, use_cases, is_supertools, avg_rating, review_count)')
    .eq('user_id', user.id)

  const subs = (rawSubs || []) as Sub[]
  if (subs.length === 0) return NextResponse.json({ report: null })

  const totalMonthly = subs.reduce((sum, s) => sum + Number(s.monthly_cost), 0)
  const totalYearly = totalMonthly * 12

  // Identify usage-based subs to exclude
  const toolIds = subs.map(s => s.tool_id)
  const { data: allTiers } = await supabase.from('tool_pricing_tiers')
    .select('tool_id, tier_name, monthly_price')
    .in('tool_id', toolIds)
  const usagePrices = new Map<string, Set<number>>()
  for (const t of allTiers || []) {
    const lower = (t.tier_name || '').toLowerCase()
    if (lower.includes('api') || lower.includes('token')) {
      const set = usagePrices.get(t.tool_id) || new Set()
      set.add(t.monthly_price)
      usagePrices.set(t.tool_id, set)
    }
  }
  const isUsageBased = (sub: Sub) => usagePrices.get(sub.tool_id)?.has(Number(sub.monthly_cost)) ?? false

  // Filter to analyzable subs
  const analyzableSubs = subs.filter(s => !isUsageBased(s) && !s.tools?.is_supertools)

  // Get category names
  const catIds = [...new Set(subs.map(s => s.tools?.category_id).filter((id): id is string => id != null))]
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .in('id', catIds.length > 0 ? catIds : ['none'])
  const catNameMap = new Map<string, string>()
  for (const cat of categories || []) catNameMap.set(cat.id, cat.name)

  // ── 1. AI-POWERED OVERLAP ANALYSIS ──
  const toolContext = analyzableSubs.map(s => ({
    name: s.tools?.name || '?',
    slug: s.tools?.slug || '',
    tagline: s.tools?.tagline || null,
    description: s.tools?.description || null,
    use_case: s.tools?.use_case || null,
    use_cases: s.tools?.use_cases || null,
    monthly_cost: Number(s.monthly_cost),
    rating: s.tools?.avg_rating || 0,
    reviews: s.tools?.review_count || 0,
  }))

  let overlaps: Array<{
    label: string
    confidence: number
    shared_capabilities: string[]
    tools: Array<{
      name: string
      slug: string
      logo_url: string | null
      cost: number
      rating: number
      reviews: number
      score: number
      unique_value: string
      verdict: 'keep' | 'consider_dropping' | 'downgrade'
    }>
    topPick: string
    topPickSlug: string
    totalCost: number
    savingsIfKeepBest: number
    savings_reasoning: string
  }> = []

  // Try AI analysis first, fall back to rule-based
  const aiAnalysis = analyzableSubs.length >= 2 ? await analyzeWithAI(toolContext) : null

  if (aiAnalysis && aiAnalysis.overlap_groups.length > 0) {
    // Map AI results back to full tool data
    const toolDataBySlug = new Map(analyzableSubs.map(s => [s.tools?.slug, s]))

    overlaps = aiAnalysis.overlap_groups
      .filter(g => g.confidence >= 50 && g.tools.length >= 2)
      .map(group => {
        const toolsWithData = group.tools
          .map(aiTool => {
            const sub = toolDataBySlug.get(aiTool.slug)
            if (!sub) return null
            return {
              name: sub.tools?.name || '?',
              slug: aiTool.slug,
              logo_url: sub.tools?.logo_url || null,
              cost: Number(sub.monthly_cost),
              rating: sub.tools?.avg_rating || 0,
              reviews: sub.tools?.review_count || 0,
              score: (sub.tools?.avg_rating || 0) * Math.log2((sub.tools?.review_count || 0) + 1),
              unique_value: aiTool.unique_value || '',
              verdict: aiTool.verdict,
            }
          })
          .filter((t): t is NonNullable<typeof t> => t != null)

        if (toolsWithData.length < 2) return null

        const keepTool = toolsWithData.find(t => t.slug === group.recommended_keep) || toolsWithData[0]
        const totalCost = toolsWithData.reduce((s, t) => s + t.cost, 0)
        const savingsIfKeepBest = Math.round((totalCost - keepTool.cost) * 12)

        return {
          label: group.label,
          confidence: group.confidence,
          shared_capabilities: group.shared_capabilities || [],
          tools: toolsWithData,
          topPick: keepTool.name,
          topPickSlug: keepTool.slug,
          totalCost,
          savingsIfKeepBest,
          savings_reasoning: group.savings_reasoning || '',
        }
      })
      .filter((o): o is NonNullable<typeof o> => o != null && o.savingsIfKeepBest > 0)
      .sort((a, b) => b.savingsIfKeepBest - a.savingsIfKeepBest)
  } else {
    // Fallback to rule-based detection
    overlaps = fallbackOverlaps(analyzableSubs, catNameMap)
  }

  // ── 2. PREMIUM OVERLAP ──
  const categoryGroups = new Map<string, Sub[]>()
  for (const sub of analyzableSubs) {
    const catId = sub.tools?.category_id
    if (!catId) continue
    const list = categoryGroups.get(catId) || []
    list.push(sub)
    categoryGroups.set(catId, list)
  }

  type PremiumOverlap = {
    label: string
    tools: { name: string; slug: string; cost: number; cheapestTier: string; cheapestCost: number }[]
    totalCost: number
    savingsIfDowngradeRest: number
  }
  const premiumOverlaps: PremiumOverlap[] = []

  for (const [catId, items] of categoryGroups.entries()) {
    if (items.length < 2) continue

    const toolTierInfo: { sub: Sub; cheapestCost: number; cheapestTier: string }[] = []
    for (const sub of items) {
      const userCost = Number(sub.monthly_cost)
      if (userCost === 0) continue

      const { data: tiers } = await supabase.from('tool_pricing_tiers')
        .select('tier_name, monthly_price')
        .eq('tool_id', sub.tool_id)
        .gt('monthly_price', 0)
        .order('monthly_price', { ascending: true })
        .limit(1)

      const cheapest = tiers?.[0]
      if (cheapest && userCost > cheapest.monthly_price * 1.3) {
        toolTierInfo.push({ sub, cheapestCost: cheapest.monthly_price, cheapestTier: cheapest.tier_name })
      }
    }

    if (toolTierInfo.length >= 2) {
      toolTierInfo.sort((a, b) => Number(b.sub.monthly_cost) - Number(a.sub.monthly_cost))
      const downgradeTargets = toolTierInfo.slice(1)
      const savingsIfDowngradeRest = downgradeTargets.reduce(
        (s, t) => s + Math.round((Number(t.sub.monthly_cost) - t.cheapestCost) * 12), 0
      )

      if (savingsIfDowngradeRest > 0) {
        premiumOverlaps.push({
          label: catNameMap.get(catId) || 'Similar Tools',
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

  // ── 3. BENCHMARK ──
  const { data: allSubsData } = await supabase.from('user_subscriptions').select('user_id, monthly_cost')
  let avgMonthly = 89
  let percentile = 50
  if (allSubsData && allSubsData.length > 0) {
    const userTotals = new Map<string, number>()
    for (const s of allSubsData) userTotals.set(s.user_id, (userTotals.get(s.user_id) || 0) + Number(s.monthly_cost))
    const totals = Array.from(userTotals.values()).sort((a, b) => a - b)
    avgMonthly = Math.round(totals.reduce((s, v) => s + v, 0) / totals.length)
    const belowCount = totals.filter(t => t < totalMonthly).length
    percentile = totals.length > 1 ? Math.round((belowCount / totals.length) * 100) : 50
  }

  // ── 4. MISSING USE CASES ──
  const ALL_USE_CASES: Record<string, string> = {
    coding: 'Coding & Development',
    'content-creation': 'Content Creation',
    marketing: 'Marketing',
    design: 'Design',
    research: 'Research',
    video: 'Video',
    sales: 'Sales',
  }

  const userUseCases = new Set(subs.map(s => s.tools?.use_case).filter(Boolean))
  const missingUseCases: Array<{ useCase: string; label: string; topTool: { name: string; slug: string; logo_url: string | null; avg_rating: number; review_count: number; cheapest_price: number } | null }> = []

  for (const [uc, label] of Object.entries(ALL_USE_CASES)) {
    if (userUseCases.has(uc)) continue
    const { data: topInCategory } = await supabase
      .from('tools')
      .select('id, name, slug, logo_url, avg_rating, review_count')
      .eq('status', 'published')
      .eq('use_case', uc)
      .gte('review_count', 3)
      .order('avg_rating', { ascending: false })
      .limit(1)

    if (topInCategory && topInCategory.length > 0) {
      const tool = topInCategory[0]
      const { data: tiers } = await supabase.from('tool_pricing_tiers')
        .select('monthly_price')
        .eq('tool_id', tool.id)
        .gt('monthly_price', 0)
        .order('monthly_price', { ascending: true })
        .limit(1)

      missingUseCases.push({
        useCase: uc,
        label,
        topTool: {
          name: tool.name, slug: tool.slug, logo_url: tool.logo_url,
          avg_rating: tool.avg_rating, review_count: tool.review_count,
          cheapest_price: tiers?.[0]?.monthly_price || 0,
        },
      })
    }
  }

  // ── 5. SAVINGS ──
  const overlapSavings = overlaps.reduce((s, o) => s + o.savingsIfKeepBest, 0)
  const premiumSavings = premiumOverlaps.reduce((s, p) => s + p.savingsIfDowngradeRest, 0)
  const totalPotentialSavings = overlapSavings + premiumSavings

  let verdict = aiAnalysis?.overall_verdict || ''
  if (!verdict) {
    if (totalPotentialSavings === 0) {
      verdict = 'Your stack looks lean. No obvious waste detected.'
    } else if (totalPotentialSavings < 200) {
      verdict = `Minor optimization possible. You could save ~$${totalPotentialSavings}/year with small adjustments.`
    } else if (totalPotentialSavings < 1000) {
      verdict = `Real savings available. Consolidating overlaps and checking your tiers could save you $${totalPotentialSavings}/year.`
    } else {
      verdict = `Significant waste detected. You could save $${totalPotentialSavings}/year.`
    }
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
      missingUseCases,
      verdict,
      aiPowered: aiAnalysis != null,
      stackEfficiency: aiAnalysis?.stack_efficiency ?? null,
    },
  })
}
