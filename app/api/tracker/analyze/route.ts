import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const USE_CASE_LABELS: Record<string, string> = {
  coding: 'coding', 'content-creation': 'content creation', marketing: 'marketing',
  design: 'design', research: 'research', video: 'video', sales: 'sales',
  'customer-support': 'customer support',
}

type Sub = {
  tool_id: string
  monthly_cost: number
  tools: { name: string; slug: string; use_case: string | null; category_id: string | null; pricing_model: string; tagline: string | null; avg_rating: number; review_count: number; has_api: boolean; is_open_source: boolean }
}

export async function GET(request: Request) {
  const ip = getClientIp(request)
  const { success } = rateLimit(`tracker:analyze:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: rawSubs } = await supabase.from('user_subscriptions')
    .select('tool_id, monthly_cost, tools:tool_id(name, slug, use_case, category_id, pricing_model, tagline, avg_rating, review_count, has_api, is_open_source)')
    .eq('user_id', user.id)

  const subs = (rawSubs || []) as Sub[]
  if (subs.length < 2) return NextResponse.json({ analysis: null })

  // Get category names
  const catIds = [...new Set(subs.map(s => s.tools?.category_id).filter((id): id is string => id != null))]
  const { data: categories } = await supabase.from('categories').select('id, name').in('id', catIds)
  const catMap = new Map<string, string>()
  for (const cat of categories || []) catMap.set(cat.id, cat.name)

  const totalMonthly = subs.reduce((s, sub) => s + Number(sub.monthly_cost), 0)
  const totalYearly = totalMonthly * 12

  // Get tier info for all tools
  const allToolIds = subs.map(s => s.tool_id)
  const { data: allTiers } = await supabase.from('tool_pricing_tiers')
    .select('tool_id, tier_name, monthly_price')
    .in('tool_id', allToolIds)

  // Identify usage-based (API/token) subs to exclude from overlap
  const usagePrices = new Map<string, Set<number>>()
  for (const t of allTiers || []) {
    const lower = (t.tier_name || '').toLowerCase()
    if (lower.includes('api') || lower.includes('token')) {
      const set = usagePrices.get(t.tool_id) || new Set()
      set.add(t.monthly_price)
      usagePrices.set(t.tool_id, set)
    }
  }

  // Group by category + use_case — exclude usage-based subs
  const catGroups = new Map<string, Sub[]>()
  for (const sub of subs) {
    if (usagePrices.get(sub.tool_id)?.has(Number(sub.monthly_cost))) continue
    const catId = sub.tools?.category_id
    if (!catId) continue
    const useCase = sub.tools?.use_case || 'general'
    const groupKey = `${catId}::${useCase}`
    const list = catGroups.get(groupKey) || []
    list.push(sub)
    catGroups.set(groupKey, list)
  }

  const cheapestTierByTool = new Map<string, { name: string; price: number }>()
  const tierCountByTool = new Map<string, number>()
  if (allTiers) {
    for (const t of allTiers) {
      tierCountByTool.set(t.tool_id, (tierCountByTool.get(t.tool_id) || 0) + 1)
      if (t.monthly_price > 0 && !cheapestTierByTool.has(t.tool_id)) {
        cheapestTierByTool.set(t.tool_id, { name: t.tier_name, price: t.monthly_price })
      }
    }
  }

  // Build analysis paragraphs
  const paragraphs: string[] = []

  // 1. Stack overview
  const paidCount = subs.filter(s => Number(s.monthly_cost) > 0).length
  const freeCount = subs.length - paidCount
  paragraphs.push(
    `You're spending $${totalMonthly}/mo ($${totalYearly}/yr) across ${subs.length} AI tools${freeCount > 0 ? ` (${paidCount} paid, ${freeCount} free)` : ''}.`
  )

  // 2. Overlap analysis
  const overlapGroups = Array.from(catGroups.entries()).filter(([, items]) => items.length >= 2)
  if (overlapGroups.length > 0) {
    const overlapLines: string[] = []
    for (const [groupKey, items] of overlapGroups) {
      const [actualCatId] = groupKey.split('::')
      const catName = catMap.get(actualCatId) || 'Unknown'
      const names = items.map(s => s.tools.name)
      const totalCatCost = items.reduce((s, i) => s + Number(i.monthly_cost), 0)
      const scored = items.map(s => ({
        name: s.tools.name,
        rating: s.tools.avg_rating,
        reviews: s.tools.review_count,
        cost: Number(s.monthly_cost),
        score: s.tools.avg_rating * Math.log2(s.tools.review_count + 1),
      })).sort((a, b) => b.score - a.score)

      const best = scored[0]
      const rest = scored.slice(1)

      if (rest.every(r => r.cost === 0)) {
        overlapLines.push(
          `${catName}: ${names.join(' and ')} overlap, but ${rest.map(r => r.name).join(' and ')} ${rest.length === 1 ? 'is' : 'are'} free — no money wasted here.`
        )
      } else {
        const wasteCost = rest.filter(r => r.cost > 0).reduce((s, r) => s + r.cost, 0)
        overlapLines.push(
          `${catName}: You're paying for ${names.join(', ')} ($${totalCatCost}/mo total). ${best.name} is the highest-rated (${best.rating.toFixed(1)} stars, ${best.reviews} reviews). Dropping the rest saves $${wasteCost * 12}/yr.`
        )
      }
    }
    paragraphs.push(overlapLines.join(' '))
  } else {
    paragraphs.push('No overlap detected — each tool serves a different purpose. That\'s a clean stack.')
  }

  // 3. Tier check — only when overlapping premium tiers
  const tierLines: string[] = []
  for (const [, items] of overlapGroups) {
    const premiumItems = items.filter(s => {
      const cheapest = cheapestTierByTool.get(s.tool_id)
      return cheapest && Number(s.monthly_cost) > cheapest.price * 1.3
    })
    if (premiumItems.length >= 2) {
      const names = premiumItems.map(s => `${s.tools.name} ($${Number(s.monthly_cost)}/mo)`)
      tierLines.push(`You're on premium tiers for both ${names.join(' and ')}. If you keep one at the top tier, downgrade the other.`)
    }
  }
  if (tierLines.length > 0) paragraphs.push(tierLines.join(' '))

  // 4. Verdict
  const overlapSavings = overlapGroups.reduce((total, [, items]) => {
    const costs = items.map(s => Number(s.monthly_cost)).sort((a, b) => b - a)
    return total + costs.slice(1).reduce((s, c) => s + c, 0)
  }, 0)

  if (overlapSavings === 0) {
    paragraphs.push('Verdict: Your stack is lean. No cuts needed.')
  } else if (overlapSavings * 12 < 200) {
    paragraphs.push(`Verdict: Minor overlap. You could save ~$${Math.round(overlapSavings * 12)}/yr but it's not urgent.`)
  } else {
    paragraphs.push(`Verdict: Consolidating overlaps saves $${Math.round(overlapSavings * 12)}/yr. Compare the overlapping tools side-by-side and keep the one you prefer.`)
  }

  return NextResponse.json({ analysis: paragraphs.join('\n\n') })
}
