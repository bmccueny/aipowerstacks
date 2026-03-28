import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

type Sub = {
  tool_id: string
  monthly_cost: number
  tools: { name: string; slug: string; logo_url: string | null; use_case: string | null; category_id: string | null; pricing_model: string; tagline: string | null; avg_rating: number; review_count: number }
}

type Alt = { id: string; name: string; slug: string; logo_url: string | null; pricing_model: string; tagline: string | null; avg_rating: number; review_count: number }

type OptTool = {
  name: string; slug: string; logo_url: string | null; price: number
  reason: string; action: 'keep' | 'replace' | 'drop'; replaces: string | null
}

function score(rating: number, reviews: number) {
  return rating * Math.log2(reviews + 1)
}

export async function GET(request: Request) {
  const ip = getClientIp(request)
  const { success } = rateLimit(`tracker:optimize:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') || 'savings'

  const { data: rawSubs } = await supabase.from('user_subscriptions')
    .select('tool_id, monthly_cost, tools:tool_id(name, slug, logo_url, use_case, category_id, pricing_model, tagline, avg_rating, review_count)')
    .eq('user_id', user.id)

  const subs = (rawSubs || []) as Sub[]
  if (subs.length < 2) return NextResponse.json({ optimized: null })

  // Group subs by category + use_case
  const catGroups = new Map<string, Sub[]>()
  const uncategorized: Sub[] = []
  for (const sub of subs) {
    const catId = sub.tools?.category_id
    if (!catId) { uncategorized.push(sub); continue }
    const useCase = sub.tools?.use_case || 'general'
    const groupKey = `${catId}::${useCase}`
    const list = catGroups.get(groupKey) || []
    list.push(sub)
    catGroups.set(groupKey, list)
  }

  const optimizedTools: OptTool[] = []

  // Uncategorized tools — always keep, nothing to compare
  for (const sub of uncategorized) {
    optimizedTools.push({
      name: sub.tools.name, slug: sub.tools.slug, logo_url: sub.tools.logo_url,
      price: Number(sub.monthly_cost), reason: 'No alternatives in this category',
      action: 'keep', replaces: null,
    })
  }

  // Process each category group
  for (const [catId, items] of catGroups.entries()) {
    if (items.length === 1) {
      // Only one tool in this category — try to find a better/cheaper one
      const sub = items[0]
      const winner = await findBestAlternative(supabase, sub, catId, mode)
      optimizedTools.push(winner)
      continue
    }

    // Multiple tools in same category — this is where dedup happens
    // Step 1: Pick the best among the user's current tools
    const scored = items.map(s => ({
      sub: s,
      cost: Number(s.monthly_cost),
      sc: score(s.tools.avg_rating || 0, s.tools.review_count || 0),
    }))

    if (mode === 'savings') {
      // Keep the cheapest current tool (if tied, highest rated wins)
      scored.sort((a, b) => a.cost - b.cost || b.sc - a.sc)
    } else {
      // Keep the best rated current tool
      scored.sort((a, b) => b.sc - a.sc)
    }

    const keeper = scored[0]
    const dropped = scored.slice(1)

    // Step 2: Check if an external alternative beats the keeper
    const betterExternal = await findBestAlternative(supabase, keeper.sub, catId, mode)

    optimizedTools.push(betterExternal)

    // Step 3: Drop the rest — these are the duplicates
    for (const d of dropped) {
      optimizedTools.push({
        name: d.sub.tools.name, slug: d.sub.tools.slug, logo_url: d.sub.tools.logo_url,
        price: d.cost, reason: `Overlaps with ${betterExternal.name} in this category`,
        action: 'drop', replaces: null,
      })
    }
  }

  // Calculate totals (only count keep + replace, not drop)
  const keptTools = optimizedTools.filter(t => t.action !== 'drop')
  const droppedTools = optimizedTools.filter(t => t.action === 'drop')
  const totalOptimized = keptTools.reduce((s, t) => s + t.price, 0)
  const totalCurrent = subs.reduce((s, sub) => s + Number(sub.monthly_cost), 0)
  const swapCount = keptTools.filter(t => t.action === 'replace').length
  const dropCount = droppedTools.length

  let summary = ''
  const diff = totalCurrent - totalOptimized
  if (swapCount === 0 && dropCount === 0) {
    summary = mode === 'savings'
      ? 'Your stack is already cost-optimized.'
      : 'You\'re already using the top-rated tools.'
  } else {
    const parts: string[] = []
    if (dropCount > 0) parts.push(`drop ${dropCount} duplicate${dropCount > 1 ? 's' : ''}`)
    if (swapCount > 0) parts.push(`${swapCount} swap${swapCount > 1 ? 's' : ''}`)
    summary = mode === 'savings'
      ? `${parts.join(' + ')} could save you $${Math.round(diff)}/mo ($${Math.round(diff * 12)}/yr).`
      : `${parts.join(' + ')} for a stronger stack${diff > 0 ? ` and save $${Math.round(diff)}/mo` : diff < 0 ? ` (+$${Math.abs(Math.round(diff))}/mo)` : ''}.`
  }

  return NextResponse.json({
    optimized: {
      tools: optimizedTools,
      total_monthly: Math.round(totalOptimized),
      summary,
      mode,
      current_monthly: Math.round(totalCurrent),
      savings_monthly: Math.round(diff),
      savings_yearly: Math.round(diff * 12),
    },
  })
}

async function findBestAlternative(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sub: Sub,
  catId: string,
  mode: string,
): Promise<OptTool> {
  const userCost = Number(sub.monthly_cost)
  const userScore = score(sub.tools.avg_rating || 0, sub.tools.review_count || 0)

  const { data: alts } = await supabase
    .from('tools')
    .select('id, name, slug, logo_url, pricing_model, tagline, avg_rating, review_count')
    .eq('status', 'published')
    .eq('category_id', catId)
    .neq('id', sub.tool_id)
    .gte('review_count', 2)
    .gte('avg_rating', 3.5)
    .order('avg_rating', { ascending: false })
    .limit(10)

  const alternatives = (alts || []) as Alt[]
  if (alternatives.length === 0) {
    return {
      name: sub.tools.name, slug: sub.tools.slug, logo_url: sub.tools.logo_url,
      price: userCost, reason: 'No rated alternatives found',
      action: 'keep', replaces: null,
    }
  }

  // Get cheapest tier for each alt
  const altIds = alternatives.map(a => a.id)
  const cheapestByAlt = new Map<string, number>()
  const { data: tiers } = await supabase.from('tool_pricing_tiers')
    .select('tool_id, monthly_price')
    .in('tool_id', altIds)
    .gt('monthly_price', 0)
    .order('monthly_price', { ascending: true })

  if (tiers) {
    for (const t of tiers) {
      if (!cheapestByAlt.has(t.tool_id)) cheapestByAlt.set(t.tool_id, t.monthly_price)
    }
  }

  if (mode === 'savings') {
    let best: { alt: Alt; price: number } | null = null
    for (const alt of alternatives) {
      const price = cheapestByAlt.get(alt.id) ?? (alt.pricing_model === 'free' ? 0 : null)
      if (price == null || price >= userCost) continue
      if (!best || price < best.price) best = { alt, price }
    }
    if (best && (userCost - best.price) >= 2) {
      return {
        name: best.alt.name, slug: best.alt.slug, logo_url: best.alt.logo_url,
        price: best.price,
        reason: `$${userCost - best.price}/mo cheaper. ${best.alt.avg_rating.toFixed(1)} stars (${best.alt.review_count} reviews).`,
        action: 'replace', replaces: sub.tools.name,
      }
    }
  } else {
    let best: { alt: Alt; price: number; sc: number } | null = null
    for (const alt of alternatives) {
      const price = cheapestByAlt.get(alt.id) ?? (alt.pricing_model === 'free' ? 0 : null)
      if (price == null) continue
      const sc = score(alt.avg_rating, alt.review_count)
      if (!best || sc > best.sc) best = { alt, price, sc }
    }
    if (best && best.sc > userScore * 1.1) {
      return {
        name: best.alt.name, slug: best.alt.slug, logo_url: best.alt.logo_url,
        price: best.price,
        reason: `Higher rated: ${best.alt.avg_rating.toFixed(1)} stars (${best.alt.review_count} reviews) vs ${(sub.tools.avg_rating || 0).toFixed(1)}.`,
        action: 'replace', replaces: sub.tools.name,
      }
    }
  }

  return {
    name: sub.tools.name, slug: sub.tools.slug, logo_url: sub.tools.logo_url,
    price: userCost,
    reason: mode === 'savings' ? 'Already the best value' : 'Already top-rated',
    action: 'keep', replaces: null,
  }
}
