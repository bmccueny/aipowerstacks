import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const ip = getClientIp(request)
  const { success } = rateLimit(`tracker:duplicates:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get user's subscriptions with tool details
  const { data: rawSubs } = await supabase
    .from('user_subscriptions')
    .select('tool_id, monthly_cost, tools:tool_id(name, slug, logo_url, use_case, use_cases, category_id, avg_rating, review_count, categories:category_id(name))')
    .eq('user_id', user.id)
  const subs = (rawSubs ?? []) as unknown as Array<{ tool_id: string; monthly_cost: number; tools: { name: string; slug: string; logo_url: string | null; use_case: string | null; use_cases: string[] | null; category_id: string | null; avg_rating: number | null; review_count: number | null; categories: { name: string } | null } | null }>

  if (!subs || subs.length < 2) {
    return NextResponse.json({ duplicates: [] })
  }

  type ToolInfo = {
    name: string
    slug: string
    logo_url: string | null
    use_case: string | null
    use_cases: string[] | null
    category_id: string | null
    avg_rating: number | null
    review_count: number | null
    categories: { name: string } | null
  }

  type SubWithTool = {
    tool_id: string
    monthly_cost: number
    tool: ToolInfo
  }

  const subsWithTools: SubWithTool[] = subs
    .filter(s => s.tools)
    .map(s => ({
      tool_id: s.tool_id,
      monthly_cost: Number(s.monthly_cost),
      tool: s.tools as unknown as ToolInfo,
    }))

  const duplicates: Array<{
    pair: [
      { tool_id: string; name: string; slug: string; logo_url: string | null; monthly_cost: number; rating: number; reviews: number },
      { tool_id: string; name: string; slug: string; logo_url: string | null; monthly_cost: number; rating: number; reviews: number },
    ]
    category: string
    overlap_reason: string
    combined_cost: number
    recommendation: { keep: string; keep_slug: string; reason: string }
  }> = []

  const seen = new Set<string>()

  for (let i = 0; i < subsWithTools.length; i++) {
    for (let j = i + 1; j < subsWithTools.length; j++) {
      const a = subsWithTools[i]
      const b = subsWithTools[j]

      const pairKey = [a.tool_id, b.tool_id].sort().join(':')
      if (seen.has(pairKey)) continue

      // Check for overlap: same category or overlapping use_cases
      let overlapReason: string | null = null

      if (a.tool.category_id && a.tool.category_id === b.tool.category_id) {
        overlapReason = `Both in ${a.tool.categories?.name || 'same category'}`
      }

      // Check use_cases array overlap
      const aUseCases = a.tool.use_cases || (a.tool.use_case ? [a.tool.use_case] : [])
      const bUseCases = b.tool.use_cases || (b.tool.use_case ? [b.tool.use_case] : [])
      const sharedUseCases = aUseCases.filter(uc => bUseCases.includes(uc))

      if (sharedUseCases.length > 0) {
        overlapReason = overlapReason
          ? `${overlapReason}, shared use: ${sharedUseCases.join(', ')}`
          : `Shared use cases: ${sharedUseCases.join(', ')}`
      }

      if (!overlapReason) continue

      seen.add(pairKey)

      // Determine recommendation: prefer higher-rated, then cheaper
      const aScore = (a.tool.avg_rating || 0) * Math.log2((a.tool.review_count || 0) + 2)
      const bScore = (b.tool.avg_rating || 0) * Math.log2((b.tool.review_count || 0) + 2)
      const keepA = aScore > bScore || (aScore === bScore && a.monthly_cost <= b.monthly_cost)

      const keep = keepA ? a : b
      const drop = keepA ? b : a

      const reason = keep.monthly_cost < drop.monthly_cost
        ? `${keep.tool.name} is cheaper and better rated`
        : keep.monthly_cost === drop.monthly_cost
          ? `${keep.tool.name} is better rated`
          : `${keep.tool.name} is better rated despite higher cost`

      const makeTool = (s: SubWithTool) => ({
        tool_id: s.tool_id,
        name: s.tool.name,
        slug: s.tool.slug,
        logo_url: s.tool.logo_url,
        monthly_cost: s.monthly_cost,
        rating: s.tool.avg_rating || 0,
        reviews: s.tool.review_count || 0,
      })

      duplicates.push({
        pair: [makeTool(a), makeTool(b)],
        category: a.tool.categories?.name || b.tool.categories?.name || 'Unknown',
        overlap_reason: overlapReason,
        combined_cost: a.monthly_cost + b.monthly_cost,
        recommendation: { keep: keep.tool.name, keep_slug: keep.tool.slug, reason },
      })
    }
  }

  // Sort by combined cost descending (biggest savings opportunity first)
  duplicates.sort((a, b) => b.combined_cost - a.combined_cost)

  return NextResponse.json({ duplicates })
}
