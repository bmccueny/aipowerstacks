import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function untypedFrom(supabase: any, table: string) { return supabase.from(table) }

const anthropic = new Anthropic()

export const maxDuration = 30

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') || 'savings' // 'savings' or 'performance'

  // Get user's subs
  const { data: rawSubs } = await untypedFrom(supabase, 'user_subscriptions')
    .select('tool_id, monthly_cost, tools:tool_id(name, slug, logo_url, use_case, category_id, pricing_model, tagline, avg_rating, review_count)')
    .eq('user_id', user.id)

  type Sub = {
    tool_id: string
    monthly_cost: number
    tools: { name: string; slug: string; logo_url: string | null; use_case: string | null; category_id: string | null; pricing_model: string; tagline: string | null; avg_rating: number; review_count: number }
  }

  const subs = (rawSubs || []) as Sub[]
  if (subs.length < 2) return NextResponse.json({ optimized: null })

  // Get category names
  const catIds = [...new Set(subs.map(s => s.tools?.category_id).filter((id): id is string => id != null))]
  const { data: categories } = await supabase.from('categories').select('id, name').in('id', catIds)
  const catMap = new Map<string, string>()
  for (const cat of categories || []) catMap.set(cat.id, cat.name)

  // For each category in the user's stack, get alternatives from our DB
  const alternativesByCategory = new Map<string, { name: string; slug: string; logo_url: string | null; pricing_model: string; tagline: string | null; avg_rating: number; review_count: number; cheapest_price: number }[]>()

  for (const catId of catIds) {
    const { data: alts } = await supabase
      .from('tools')
      .select('id, name, slug, logo_url, pricing_model, tagline, avg_rating, review_count')
      .eq('status', 'published')
      .eq('category_id', catId)
      .gte('review_count', 1)
      .order('avg_rating', { ascending: false })
      .limit(10)

    if (!alts) continue

    // Get cheapest paid tier for each alt
    const altIds = alts.map(a => a.id)
    const { data: tiers } = await untypedFrom(supabase, 'tool_pricing_tiers')
      .select('tool_id, monthly_price')
      .in('tool_id', altIds)
      .gt('monthly_price', 0)
      .order('monthly_price', { ascending: true })

    const cheapestByTool = new Map<string, number>()
    if (tiers) {
      for (const t of tiers) {
        if (!cheapestByTool.has(t.tool_id)) cheapestByTool.set(t.tool_id, t.monthly_price)
      }
    }

    alternativesByCategory.set(catId, alts.map(a => ({
      name: a.name,
      slug: a.slug,
      logo_url: a.logo_url,
      pricing_model: a.pricing_model,
      tagline: a.tagline,
      avg_rating: a.avg_rating,
      review_count: a.review_count,
      cheapest_price: cheapestByTool.get(a.id) || 0,
    })))
  }

  // Build prompt
  const currentStack = subs.map(s => {
    const cat = s.tools?.category_id ? catMap.get(s.tools.category_id) || 'Unknown' : 'Unknown'
    return `- ${s.tools.name} ($${Number(s.monthly_cost)}/mo) — ${s.tools.tagline || 'No description'}. Category: ${cat}. Rating: ${s.tools.avg_rating > 0 ? `${s.tools.avg_rating}/5 (${s.tools.review_count} reviews)` : 'unrated'}.`
  }).join('\n')

  const alternativesText = Array.from(alternativesByCategory.entries()).map(([catId, alts]) => {
    const catName = catMap.get(catId) || 'Unknown'
    const altList = alts.map(a => `  - ${a.name} (from $${a.cheapest_price}/mo, ${a.pricing_model}) — ${a.tagline || 'No description'}. Rating: ${a.avg_rating > 0 ? `${a.avg_rating}/5 (${a.review_count} reviews)` : 'unrated'}.`).join('\n')
    return `${catName}:\n${altList}`
  }).join('\n\n')

  const totalMonthly = subs.reduce((s, sub) => s + Number(sub.monthly_cost), 0)

  const modeInstructions = mode === 'performance'
    ? 'Pick the BEST-RATED, most capable tool in each category regardless of cost. Prioritize ratings, review count, and feature set. Cost is secondary.'
    : 'Pick the CHEAPEST tool in each category that still gets the job done. Prioritize savings but don\'t suggest tools rated below 3.5 stars or with fewer than 3 reviews — those are too risky.'

  let message
  try {
    message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `You are building an optimized AI tool stack. The user currently spends $${totalMonthly}/mo.

Their current stack:
${currentStack}

Available alternatives from our database (ONLY pick from these):
${alternativesText}

Mode: ${mode === 'performance' ? 'BEST PERFORMANCE' : 'BEST VALUE (save money)'}
${modeInstructions}

IMPORTANT RULES:
- ONLY suggest tools from the alternatives list above. Never invent tools.
- For each tool in their current stack, either KEEP it or REPLACE it with a specific alternative.
- If the current tool IS the best option for this mode, keep it.
- Include the monthly price for each tool in your recommendation.

Respond in this exact JSON format (no markdown, no backticks, just raw JSON):
{
  "tools": [
    {"name": "Tool Name", "slug": "tool-slug", "price": 20, "reason": "One sentence why", "action": "keep" | "replace", "replaces": "Original Tool Name or null"}
  ],
  "total_monthly": 70,
  "summary": "One sentence summary of the optimized stack"
}`
    }],
    })
  } catch (err) {
    return NextResponse.json({ optimized: null, error: `AI call failed: ${err instanceof Error ? err.message : String(err)}` })
  }

  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const parsed = JSON.parse(responseText)

    // Enrich with logo_url from our DB
    const allToolSlugs = parsed.tools.map((t: { slug: string }) => t.slug)
    const { data: toolLogos } = await supabase
      .from('tools')
      .select('slug, logo_url')
      .in('slug', allToolSlugs)

    const logoMap = new Map<string, string | null>()
    for (const t of toolLogos || []) logoMap.set(t.slug, t.logo_url)

    const enriched = {
      ...parsed,
      tools: parsed.tools.map((t: { slug: string; name: string; price: number; reason: string; action: string; replaces: string | null }) => ({
        ...t,
        logo_url: logoMap.get(t.slug) || null,
      })),
      mode,
      current_monthly: totalMonthly,
      savings_monthly: totalMonthly - parsed.total_monthly,
      savings_yearly: (totalMonthly - parsed.total_monthly) * 12,
    }

    return NextResponse.json({ optimized: enriched })
  } catch {
    return NextResponse.json({ optimized: null, error: 'Failed to parse optimization' })
  }
}
