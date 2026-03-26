import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function untypedFrom(supabase: any, table: string) { return supabase.from(table) }

type Sub = {
  tool_id: string
  monthly_cost: number
  tools: { name: string; slug: string; logo_url: string | null; use_case: string | null; category_id: string | null; pricing_model: string; tagline: string | null; avg_rating: number; review_count: number }
}

type Alt = { id: string; name: string; slug: string; logo_url: string | null; pricing_model: string; tagline: string | null; avg_rating: number; review_count: number }

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') || 'savings'

  const { data: rawSubs } = await untypedFrom(supabase, 'user_subscriptions')
    .select('tool_id, monthly_cost, tools:tool_id(name, slug, logo_url, use_case, category_id, pricing_model, tagline, avg_rating, review_count)')
    .eq('user_id', user.id)

  const subs = (rawSubs || []) as Sub[]
  if (subs.length < 2) return NextResponse.json({ optimized: null })

  const catIds = [...new Set(subs.map(s => s.tools?.category_id).filter((id): id is string => id != null))]

  // For each category, get alternatives with their cheapest tier
  const optimizedTools: {
    name: string; slug: string; logo_url: string | null; price: number
    reason: string; action: 'keep' | 'replace'; replaces: string | null
  }[] = []

  for (const sub of subs) {
    const catId = sub.tools?.category_id
    if (!catId) {
      // No category — keep it, nothing to compare against
      optimizedTools.push({
        name: sub.tools.name, slug: sub.tools.slug, logo_url: sub.tools.logo_url,
        price: Number(sub.monthly_cost), reason: 'No alternatives in this category',
        action: 'keep', replaces: null,
      })
      continue
    }

    // Get alternatives in same category with decent ratings
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

    // Get cheapest paid tier for each alternative
    const altIds = alternatives.map(a => a.id)
    let cheapestByAlt = new Map<string, number>()
    if (altIds.length > 0) {
      const { data: tiers } = await untypedFrom(supabase, 'tool_pricing_tiers')
        .select('tool_id, monthly_price')
        .in('tool_id', altIds)
        .gt('monthly_price', 0)
        .order('monthly_price', { ascending: true })

      if (tiers) {
        for (const t of tiers) {
          if (!cheapestByAlt.has(t.tool_id)) cheapestByAlt.set(t.tool_id, t.monthly_price)
        }
      }
    }

    const userCost = Number(sub.monthly_cost)
    const userRating = sub.tools.avg_rating || 0
    const userReviews = sub.tools.review_count || 0
    const userScore = userRating * Math.log2(userReviews + 1)

    if (mode === 'savings') {
      // Find the cheapest alternative that's still decent (3.5+ stars, 2+ reviews)
      let bestSaving: { alt: Alt; price: number } | null = null
      for (const alt of alternatives) {
        const altPrice = cheapestByAlt.get(alt.id)
        // Also consider free tools
        const effectivePrice = altPrice ?? (alt.pricing_model === 'free' ? 0 : null)
        if (effectivePrice == null) continue
        if (effectivePrice >= userCost) continue // Not cheaper
        if (!bestSaving || effectivePrice < bestSaving.price) {
          bestSaving = { alt, price: effectivePrice }
        }
      }

      if (bestSaving && (userCost - bestSaving.price) >= 2) {
        const savings = userCost - bestSaving.price
        optimizedTools.push({
          name: bestSaving.alt.name, slug: bestSaving.alt.slug, logo_url: bestSaving.alt.logo_url,
          price: bestSaving.price,
          reason: `$${savings}/mo cheaper. Rated ${bestSaving.alt.avg_rating.toFixed(1)} stars (${bestSaving.alt.review_count} reviews).`,
          action: 'replace', replaces: sub.tools.name,
        })
      } else {
        optimizedTools.push({
          name: sub.tools.name, slug: sub.tools.slug, logo_url: sub.tools.logo_url,
          price: userCost,
          reason: userCost === 0 ? 'Already free' : 'Already the best value in this category',
          action: 'keep', replaces: null,
        })
      }
    } else {
      // Performance mode — find the highest-rated alternative
      let bestPerf: { alt: Alt; price: number; score: number } | null = null
      for (const alt of alternatives) {
        const altPrice = cheapestByAlt.get(alt.id) ?? (alt.pricing_model === 'free' ? 0 : null)
        if (altPrice == null) continue
        const altScore = alt.avg_rating * Math.log2(alt.review_count + 1)
        if (!bestPerf || altScore > bestPerf.score) {
          bestPerf = { alt, price: altPrice, score: altScore }
        }
      }

      if (bestPerf && bestPerf.score > userScore * 1.1) {
        // Alternative is meaningfully better
        optimizedTools.push({
          name: bestPerf.alt.name, slug: bestPerf.alt.slug, logo_url: bestPerf.alt.logo_url,
          price: bestPerf.price,
          reason: `Higher rated: ${bestPerf.alt.avg_rating.toFixed(1)} stars (${bestPerf.alt.review_count} reviews) vs your ${userRating.toFixed(1)} stars.`,
          action: 'replace', replaces: sub.tools.name,
        })
      } else {
        optimizedTools.push({
          name: sub.tools.name, slug: sub.tools.slug, logo_url: sub.tools.logo_url,
          price: userCost,
          reason: 'Already the top-rated option in this category',
          action: 'keep', replaces: null,
        })
      }
    }
  }

  const totalOptimized = optimizedTools.reduce((s, t) => s + t.price, 0)
  const totalCurrent = subs.reduce((s, sub) => s + Number(sub.monthly_cost), 0)
  const swapCount = optimizedTools.filter(t => t.action === 'replace').length

  let summary = ''
  if (swapCount === 0) {
    summary = mode === 'savings'
      ? 'Your stack is already cost-optimized. No cheaper alternatives with good ratings found.'
      : 'You\'re already using the top-rated tools in each category.'
  } else {
    const diff = totalCurrent - totalOptimized
    summary = mode === 'savings'
      ? `${swapCount} swap${swapCount > 1 ? 's' : ''} could save you $${Math.round(diff)}/mo ($${Math.round(diff * 12)}/yr) without sacrificing quality.`
      : `${swapCount} upgrade${swapCount > 1 ? 's' : ''} for better-rated tools${diff < 0 ? ` (+$${Math.abs(Math.round(diff))}/mo)` : diff > 0 ? ` and save $${Math.round(diff)}/mo` : ''}.`
  }

  return NextResponse.json({
    optimized: {
      tools: optimizedTools,
      total_monthly: Math.round(totalOptimized),
      summary,
      mode,
      current_monthly: Math.round(totalCurrent),
      savings_monthly: Math.round(totalCurrent - totalOptimized),
      savings_yearly: Math.round((totalCurrent - totalOptimized) * 12),
    },
  })
}
