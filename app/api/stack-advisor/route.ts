import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callClaude } from '@/lib/utils/anthropic'

export const maxDuration = 30

interface AdvisorRequest {
  role: string
  budget: number
  priorities?: string[]
}

export async function POST(request: Request) {
  const body = await request.json() as AdvisorRequest
  const { role, budget, priorities = [] } = body

  if (!role || budget == null) {
    return NextResponse.json({ error: 'role and budget are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fetch candidate tools: published, with pricing, high-rated
  const { data: rawTools } = await supabase
    .from('tools')
    .select('id, name, slug, tagline, pricing_model, pricing_details, avg_rating, review_count, use_case, has_api, is_open_source, category_id')
    .eq('status', 'published')
    .gt('avg_rating', 3.5)
    .order('avg_rating', { ascending: false })
    .limit(80)

  const tools = rawTools as { id: string; name: string; slug: string; tagline: string; pricing_model: string; pricing_details: string | null; avg_rating: number; review_count: number; use_case: string | null; has_api: boolean; is_open_source: boolean; category_id: string }[] | null

  if (!tools || tools.length === 0) {
    return NextResponse.json({ error: 'No tools available' }, { status: 500 })
  }

  // Get pricing tiers for budget filtering
  const toolIds = tools.map(t => t.id)
  const { data: tiers } = await supabase
    .from('tool_pricing_tiers')
    .select('tool_id, tier_name, monthly_price')
    .in('tool_id', toolIds)
    .gt('monthly_price', 0)
    .order('monthly_price', { ascending: true })

  // Build cheapest tier map
  const cheapestTier = new Map<string, number>()
  for (const tier of (tiers ?? [])) {
    if (!cheapestTier.has(tier.tool_id) || tier.monthly_price < cheapestTier.get(tier.tool_id)!) {
      cheapestTier.set(tier.tool_id, tier.monthly_price)
    }
  }

  // Filter to tools within budget (allow free tools + tools with paid tier under budget)
  const affordable = tools.filter(t => {
    if (t.pricing_model === 'free') return true
    const cheapest = cheapestTier.get(t.id)
    if (!cheapest) return true // no pricing data, include
    return cheapest <= budget
  })

  // Prepare context for Claude
  const toolContext = affordable.slice(0, 40).map(t => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    tagline: t.tagline,
    pricing: t.pricing_model,
    cheapest_price: cheapestTier.get(t.id) ?? 0,
    rating: t.avg_rating,
    reviews: t.review_count,
  }))

  const priorityText = priorities.length > 0 ? `\nPriorities: ${priorities.join(', ')}` : ''

  try {
    const result = await callClaude({
      messages: [{
        role: 'user',
        content: `You are an AI tools advisor. A user needs a recommended AI tool stack.

Role: ${role}
Monthly budget: $${budget}${priorityText}

Available tools (JSON):
${JSON.stringify(toolContext, null, 0)}

Respond with a JSON object (no markdown fences):
{
  "stack": [
    { "id": "<tool_id>", "reason": "<1 sentence why this tool>", "monthly_cost": <number>, "role_in_stack": "<what it does for them>" }
  ],
  "total_monthly": <number>,
  "savings_tip": "<1 sentence on how to save more>",
  "summary": "<2-3 sentence overview of the recommended stack>"
}

Rules:
- Recommend 3-6 tools max
- Total cost must stay under $${budget}/month
- Include at least 1 free tool if possible
- Prioritize highly-rated tools (4.0+)
- Each tool should serve a distinct purpose — no overlap
- Be specific about why each tool fits this role`
      }],
      maxTokens: 800,
      temperature: 0.6,
      model: 'claude-haiku-4-5-20251001',
    })

    // Parse JSON from response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to generate recommendation' }, { status: 500 })
    }

    const recommendation = JSON.parse(jsonMatch[0])

    // Enrich with full tool data
    const recommendedIds = recommendation.stack.map((s: { id: string }) => s.id)
    const { data: fullTools } = await supabase
      .from('tools')
      .select('id, name, slug, tagline, logo_url, pricing_model, avg_rating')
      .in('id', recommendedIds)

    const toolMap = new Map((fullTools ?? []).map(t => [t.id, t]))
    const enrichedStack = recommendation.stack.map((s: { id: string; reason: string; monthly_cost: number; role_in_stack: string }) => ({
      ...s,
      tool: toolMap.get(s.id) ?? null,
    }))

    return NextResponse.json({
      stack: enrichedStack,
      total_monthly: recommendation.total_monthly,
      savings_tip: recommendation.savings_tip,
      summary: recommendation.summary,
      budget,
      role,
    })
  } catch (err: unknown) {
    return NextResponse.json({
      error: 'AI recommendation failed',
      message: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }
}
