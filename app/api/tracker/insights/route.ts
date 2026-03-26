import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function untypedFrom(supabase: any, table: string) { return supabase.from(table) }

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const toolId = searchParams.get('tool_id')

  if (!toolId) return NextResponse.json({ insights: [] })

  // Get the tool's details
  const { data: tool } = await supabase
    .from('tools')
    .select('id, name, slug, use_case, pricing_model')
    .eq('id', toolId)
    .single()

  if (!tool) return NextResponse.json({ insights: [] })

  const insights: { type: string; title: string; body: string; action?: { label: string; href: string } }[] = []

  // 1. Cheaper alternatives in the same use_case
  if (tool.use_case) {
    const { data: alternatives } = await supabase
      .from('tools')
      .select('id, name, slug, logo_url, pricing_model')
      .eq('status', 'published')
      .eq('use_case', tool.use_case)
      .neq('id', tool.id)
      .in('pricing_model', ['free', 'freemium'])
      .limit(3)

    // Also get cheaper paid alternatives with pricing tiers
    const { data: paidAlts } = await supabase
      .from('tools')
      .select('id, name, slug, logo_url, pricing_model')
      .eq('status', 'published')
      .eq('use_case', tool.use_case)
      .neq('id', tool.id)
      .eq('pricing_model', 'paid')
      .limit(6)

    // Get the cheapest tier for each paid alternative
    const altIds = (paidAlts || []).map((a: { id: string }) => a.id)
    let cheaperAlts: { name: string; slug: string; cheapest: number }[] = []
    if (altIds.length > 0) {
      const { data: altTiers } = await untypedFrom(supabase, 'tool_pricing_tiers')
        .select('tool_id, monthly_price')
        .in('tool_id', altIds)
        .gt('monthly_price', 0)
        .order('monthly_price', { ascending: true })

      // Get user's cost for this tool
      const { data: userSub } = await untypedFrom(supabase, 'user_subscriptions')
        .select('monthly_cost')
        .eq('user_id', user.id)
        .eq('tool_id', tool.id)
        .single()

      const userCost = userSub?.monthly_cost ? Number(userSub.monthly_cost) : 0

      if (altTiers && userCost > 0) {
        // Find the cheapest tier per tool
        const cheapestByTool = new Map<string, number>()
        for (const tier of altTiers) {
          const existing = cheapestByTool.get(tier.tool_id)
          if (!existing || tier.monthly_price < existing) {
            cheapestByTool.set(tier.tool_id, tier.monthly_price)
          }
        }

        cheaperAlts = (paidAlts || [])
          .filter((a: { id: string }) => {
            const cheapest = cheapestByTool.get(a.id)
            return cheapest != null && cheapest < userCost
          })
          .map((a: { id: string; name: string; slug: string }) => ({
            name: a.name,
            slug: a.slug,
            cheapest: cheapestByTool.get(a.id) || 0,
          }))
          .slice(0, 3)
      }
    }

    if (cheaperAlts.length > 0) {
      const names = cheaperAlts.map(a => `${a.name} ($${a.cheapest}/mo)`).join(', ')
      insights.push({
        type: 'cheaper_alternative',
        title: 'Cheaper alternatives exist',
        body: `${names} ${cheaperAlts.length === 1 ? 'does' : 'do'} the same thing for less.`,
        action: {
          label: 'Compare them',
          href: `/compare?tools=${tool.slug},${cheaperAlts.map(a => a.slug).join(',')}`,
        },
      })
    }

    if ((alternatives || []).length > 0) {
      const freeNames = (alternatives || []).map((a: { name: string }) => a.name).join(', ')
      insights.push({
        type: 'free_alternative',
        title: 'Free options available',
        body: `${freeNames} ${(alternatives || []).length === 1 ? 'offers' : 'offer'} free plans in this category.`,
        action: {
          label: 'Check them out',
          href: `/tools?use_case=${tool.use_case}&pricing=free,freemium`,
        },
      })
    }
  }

  // 2. Tier check — is the user on a higher tier than most?
  const { data: allTiers } = await untypedFrom(supabase, 'tool_pricing_tiers')
    .select('tier_name, monthly_price')
    .eq('tool_id', tool.id)
    .order('monthly_price', { ascending: true })

  const { data: userSub } = await untypedFrom(supabase, 'user_subscriptions')
    .select('monthly_cost')
    .eq('user_id', user.id)
    .eq('tool_id', tool.id)
    .single()

  if (allTiers && allTiers.length >= 2 && userSub) {
    const userCost = Number(userSub.monthly_cost)
    const paidTiers = allTiers.filter((t: { monthly_price: number }) => t.monthly_price > 0)
    const cheapestPaid = paidTiers[0]

    if (cheapestPaid && userCost > cheapestPaid.monthly_price * 1.5) {
      const savings = Math.round((userCost - cheapestPaid.monthly_price) * 12)
      insights.push({
        type: 'tier_check',
        title: `You might not need the top tier`,
        body: `The ${cheapestPaid.tier_name} plan is $${cheapestPaid.monthly_price}/mo. Downgrading could save you $${savings}/year.`,
        action: {
          label: 'See all plans',
          href: `/tools/${tool.slug}`,
        },
      })
    }
  }

  return NextResponse.json({ insights })
}
