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

  const { data: rawTool } = await supabase
    .from('tools')
    .select('id, name, slug, use_case, category_id, pricing_model')
    .eq('id', toolId)
    .single()

  if (!rawTool) return NextResponse.json({ insights: [] })
  const tool = rawTool as { id: string; name: string; slug: string; use_case: string | null; category_id: string; pricing_model: string }

  // Get user's cost for this tool
  const { data: userSub } = await untypedFrom(supabase, 'user_subscriptions')
    .select('monthly_cost')
    .eq('user_id', user.id)
    .eq('tool_id', tool.id)
    .single()

  const userCost = userSub?.monthly_cost ? Number(userSub.monthly_cost) : 0

  const insights: { type: string; title: string; body: string; action?: { label: string; href: string } }[] = []

  // Tier check — only actionable per-tool insight.
  // We don't suggest "cheaper alternatives" here because we can't judge
  // quality. The savings report handles overlaps at the category level.
  const { data: allTiers } = await untypedFrom(supabase, 'tool_pricing_tiers')
    .select('tier_name, monthly_price')
    .eq('tool_id', tool.id)
    .order('monthly_price', { ascending: true })

  if (allTiers && allTiers.length >= 2 && userCost > 0) {
    const paidTiers = allTiers.filter((t: { monthly_price: number }) => t.monthly_price > 0)
    const cheapestPaid = paidTiers[0]

    if (cheapestPaid && userCost > cheapestPaid.monthly_price * 1.4) {
      const savings = Math.round((userCost - cheapestPaid.monthly_price) * 12)
      insights.push({
        type: 'tier_check',
        title: `${tool.name}: are you using the premium features?`,
        body: `The ${cheapestPaid.tier_name} plan is $${cheapestPaid.monthly_price}/mo. If you don't need the extras, downgrading saves $${savings}/year.`,
        action: {
          label: `Review ${tool.name} plans`,
          href: `/tools/${tool.slug}`,
        },
      })
    }
  }

  return NextResponse.json({ insights })
}
