import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function untypedFrom(supabase: any, table: string) { return supabase.from(table) }

type Alt = { id: string; name: string; slug: string; tagline: string | null; logo_url: string | null; pricing_model: string; category_id: string; use_case: string | null }

const USE_CASE_LABELS: Record<string, string> = {
  coding: 'coding',
  'content-creation': 'content creation',
  marketing: 'marketing',
  design: 'design',
  research: 'research',
  video: 'video',
  sales: 'sales',
  'customer-support': 'customer support',
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const toolId = searchParams.get('tool_id')
  if (!toolId) return NextResponse.json({ insights: [] })

  // Get the tool's full details including category
  const { data: rawTool } = await supabase
    .from('tools')
    .select('id, name, slug, tagline, use_case, category_id, pricing_model')
    .eq('id', toolId)
    .single()

  if (!rawTool) return NextResponse.json({ insights: [] })
  const tool = rawTool as { id: string; name: string; slug: string; tagline: string | null; use_case: string | null; category_id: string; pricing_model: string }

  // Get category name for display
  const { data: category } = await supabase
    .from('categories')
    .select('name')
    .eq('id', tool.category_id)
    .single()

  const categoryName = category?.name || 'this category'
  const useCaseLabel = tool.use_case ? USE_CASE_LABELS[tool.use_case] || tool.use_case : null

  // Get user's cost for this tool
  const { data: userSub } = await untypedFrom(supabase, 'user_subscriptions')
    .select('monthly_cost')
    .eq('user_id', user.id)
    .eq('tool_id', tool.id)
    .single()

  const userCost = userSub?.monthly_cost ? Number(userSub.monthly_cost) : 0

  const insights: { type: string; title: string; body: string; action?: { label: string; href: string } }[] = []

  // ── 1. Find alternatives that match BOTH category AND use_case (tightest match)
  // Fall back to category-only if use_case is null
  const matchFilters = supabase
    .from('tools')
    .select('id, name, slug, tagline, logo_url, pricing_model, category_id, use_case')
    .eq('status', 'published')
    .eq('category_id', tool.category_id)
    .neq('id', tool.id)

  const { data: categoryMatches } = tool.use_case
    ? await matchFilters.eq('use_case', tool.use_case).limit(20)
    : await matchFilters.limit(20)

  const matches = (categoryMatches || []) as Alt[]

  // ── 1a. Cheaper paid alternatives (same category + use_case)
  if (userCost > 0 && matches.length > 0) {
    const paidMatches = matches.filter(m => m.pricing_model === 'paid')
    const paidIds = paidMatches.map(m => m.id)

    if (paidIds.length > 0) {
      const { data: altTiers } = await untypedFrom(supabase, 'tool_pricing_tiers')
        .select('tool_id, monthly_price')
        .in('tool_id', paidIds)
        .gt('monthly_price', 0)
        .order('monthly_price', { ascending: true })

      if (altTiers) {
        const cheapestByTool = new Map<string, number>()
        for (const tier of altTiers) {
          if (!cheapestByTool.has(tier.tool_id)) {
            cheapestByTool.set(tier.tool_id, tier.monthly_price)
          }
        }

        const cheaperAlts = paidMatches
          .filter(m => {
            const cheapest = cheapestByTool.get(m.id)
            return cheapest != null && cheapest < userCost
          })
          .map(m => ({
            name: m.name,
            slug: m.slug,
            tagline: m.tagline,
            cheapest: cheapestByTool.get(m.id) || 0,
            savings: Math.round((userCost - (cheapestByTool.get(m.id) || 0)) * 12),
          }))
          .sort((a, b) => b.savings - a.savings)
          .slice(0, 2)

        if (cheaperAlts.length > 0) {
          const lines = cheaperAlts.map(a => {
            const desc = a.tagline ? ` — ${a.tagline}` : ''
            return `${a.name} ($${a.cheapest}/mo${desc})`
          })
          insights.push({
            type: 'cheaper_alternative',
            title: `Cheaper ${categoryName} alternatives`,
            body: `${lines.join(' or ')}. Could save you up to $${cheaperAlts[0].savings}/year.`,
            action: {
              label: `Compare ${categoryName} tools`,
              href: `/compare?tools=${tool.slug},${cheaperAlts.map(a => a.slug).join(',')}`,
            },
          })
        }
      }
    }
  }

  // ── 1b. Free alternatives (same category + use_case)
  const freeMatches = matches
    .filter(m => m.pricing_model === 'free' || m.pricing_model === 'freemium')
    .slice(0, 3)

  if (freeMatches.length > 0 && userCost > 0) {
    const freeLines = freeMatches.map(m => {
      const desc = m.tagline ? ` — ${m.tagline}` : ''
      return `${m.name}${desc}`
    })
    insights.push({
      type: 'free_alternative',
      title: `Free ${categoryName} options`,
      body: `${freeLines.join(', ')} ${freeMatches.length === 1 ? 'offers a' : 'offer'} free ${useCaseLabel || categoryName} plan${freeMatches.length === 1 ? '' : 's'}.`,
      action: {
        label: `Browse free ${categoryName} tools`,
        href: `/tools?category=${tool.category_id}&pricing=free,freemium`,
      },
    })
  }

  // ── 2. Tier check — is the user on a much higher tier than the cheapest paid plan?
  const { data: allTiers } = await untypedFrom(supabase, 'tool_pricing_tiers')
    .select('tier_name, monthly_price')
    .eq('tool_id', tool.id)
    .order('monthly_price', { ascending: true })

  if (allTiers && allTiers.length >= 2 && userCost > 0) {
    const paidTiers = allTiers.filter((t: { monthly_price: number }) => t.monthly_price > 0)
    const cheapestPaid = paidTiers[0]

    if (cheapestPaid && userCost > cheapestPaid.monthly_price * 1.5) {
      const savings = Math.round((userCost - cheapestPaid.monthly_price) * 12)
      insights.push({
        type: 'tier_check',
        title: `${tool.name}: you might not need the top tier`,
        body: `The ${cheapestPaid.tier_name} plan is $${cheapestPaid.monthly_price}/mo. Downgrading saves $${savings}/year. Check if you actually use the premium features.`,
        action: {
          label: `Review ${tool.name} plans`,
          href: `/tools/${tool.slug}`,
        },
      })
    }
  }

  return NextResponse.json({ insights })
}
