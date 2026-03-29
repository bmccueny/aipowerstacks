import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const INDUSTRY_AVG_PER_TOOL = 20 // benchmark average cost per AI tool/mo
const CATEGORY_BONUS = 10

type SubRow = {
  tool_id: string
  monthly_cost: number
  use_tags: string[] | null
  tools: {
    name: string
    pricing_model: string
    use_case: string | null
    category_id: string | null
    categories: { name: string } | null
  } | null
}

function getGrade(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
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

  const { data: subs, error } = await supabase
    .from('user_subscriptions')
    .select('tool_id, monthly_cost, use_tags, tools:tool_id(name, pricing_model, use_case, category_id, categories:category_id(name))')
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!subs || subs.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 subscriptions' }, { status: 400 })
  }

  const typedSubs = subs as unknown as SubRow[]

  // 1. Overlap penalty: group by use_tags or category+use_case
  const groups: Record<string, string[]> = {}
  for (const sub of typedSubs) {
    const tags = sub.use_tags && sub.use_tags.length > 0 ? sub.use_tags : null
    if (tags) {
      for (const tag of tags) {
        const key = `intent::${tag}`
        if (!groups[key]) groups[key] = []
        groups[key].push(sub.tools?.name || sub.tool_id)
      }
    } else {
      const catId = sub.tools?.category_id
      if (!catId) continue
      const useCase = sub.tools?.use_case || 'general'
      const key = `cat::${catId}::${useCase}`
      if (!groups[key]) groups[key] = []
      groups[key].push(sub.tools?.name || sub.tool_id)
    }
  }

  let overlapPairs = 0
  const overlapDetails: string[] = []
  const seen = new Set<string>()
  for (const [, items] of Object.entries(groups)) {
    if (items.length >= 2) {
      const pairKey = items.sort().join(',')
      if (seen.has(pairKey)) continue
      seen.add(pairKey)
      overlapPairs++
      overlapDetails.push(items.join(' & '))
    }
  }

  const overlapScore = Math.max(0, 100 - overlapPairs * 15)

  // 2. Cost efficiency: compare to benchmark
  const totalSpend = typedSubs.reduce((sum, s) => sum + Number(s.monthly_cost), 0)
  const benchmarkSpend = typedSubs.length * INDUSTRY_AVG_PER_TOOL
  const spendRatio = benchmarkSpend > 0 ? totalSpend / benchmarkSpend : 1
  // Under benchmark = good, over = bad
  let efficiencyScore: number
  if (spendRatio <= 0.7) efficiencyScore = 100
  else if (spendRatio <= 1.0) efficiencyScore = 80 + (1.0 - spendRatio) * (20 / 0.3)
  else if (spendRatio <= 1.5) efficiencyScore = 50 + (1.5 - spendRatio) * (30 / 0.5)
  else efficiencyScore = Math.max(0, 50 - (spendRatio - 1.5) * 30)

  // 3. Coverage: unique categories
  const uniqueCategories = new Set<string>()
  for (const sub of typedSubs) {
    if (sub.tools?.categories?.name) uniqueCategories.add(sub.tools.categories.name)
    if (sub.use_tags) {
      for (const tag of sub.use_tags) uniqueCategories.add(tag)
    }
  }
  const coverageScore = Math.min(100, uniqueCategories.size * CATEGORY_BONUS)

  // 4. Value: bonus for free/freemium tools
  const freeCount = typedSubs.filter(s =>
    s.tools?.pricing_model === 'free' || s.tools?.pricing_model === 'freemium'
  ).length
  const freeRatio = freeCount / typedSubs.length
  const valueScore = Math.min(100, freeRatio * 100 + 40) // baseline 40, max 100

  // Weighted composite
  const composite = Math.round(
    overlapScore * 0.30 +
    efficiencyScore * 0.25 +
    coverageScore * 0.25 +
    valueScore * 0.20
  )
  const finalScore = Math.max(0, Math.min(100, composite))

  // Generate tips
  const tips: string[] = []
  if (overlapPairs > 0) {
    const overlapCost = typedSubs.reduce((sum, s) => sum + Number(s.monthly_cost), 0)
    const potentialSave = Math.round(overlapCost * 0.15 * overlapPairs)
    tips.push(
      `You have ${overlapPairs} overlapping tool${overlapPairs > 1 ? ' pairs' : ' pair'} (${overlapDetails.slice(0, 2).join('; ')}) — consider consolidating to save ~$${potentialSave}/mo`
    )
  }
  if (spendRatio > 1.2) {
    tips.push(
      `Your spend is ${Math.round((spendRatio - 1) * 100)}% above the average — look for annual billing or cheaper tiers`
    )
  }
  if (uniqueCategories.size < 3) {
    tips.push('Your stack covers few use cases — you might be missing tools that could boost productivity')
  }
  if (freeRatio === 0) {
    tips.push('Consider free-tier alternatives for tools you use lightly to reduce costs')
  }
  if (tips.length === 0) {
    tips.push('Your stack looks well-optimized! Keep an eye on new tools that could add value.')
  }

  return NextResponse.json({
    score: finalScore,
    grade: getGrade(finalScore),
    breakdown: {
      overlap: Math.round(overlapScore),
      efficiency: Math.round(efficiencyScore),
      coverage: Math.round(coverageScore),
      value: Math.round(valueScore),
    },
    tips,
  })
}
