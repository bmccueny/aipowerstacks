import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fromTable } from '@/lib/supabase/untyped'

export type Insight = {
  type: 'price_increase' | 'price_decrease' | 'new_alternative'
  message: string
  severity: 'info' | 'warning' | 'critical'
  toolSlug?: string
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const toolId = searchParams.get('tool_id')
  if (!toolId) return NextResponse.json({ insights: [] })

  const insights: Insight[] = []

  // 1. Get the tool's category so we can find alternatives
  const { data: tool } = await supabase
    .from('tools')
    .select('id, name, slug, category_id')
    .eq('id', toolId)
    .single()

  if (!tool) return NextResponse.json({ insights: [] })

  // 2. Check tool_price_history for recent price changes (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
  type PriceRecord = { tool_id: string; price: number; created_at: string; tier_name?: string }

  const { data: priceHistory } = await fromTable(supabase, 'tool_price_history')
    .select('tool_id, price, created_at, tier_name')
    .eq('tool_id', toolId)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(10) as { data: PriceRecord[] | null }

  if (priceHistory && priceHistory.length >= 2) {
    const latest = priceHistory[0]
    const previous = priceHistory[1]
    const diff = latest.price - previous.price

    if (diff > 0) {
      const pct = Math.round((diff / previous.price) * 100)
      insights.push({
        type: 'price_increase',
        message: `${tool.name} price increased by ${pct}% ($${previous.price} → $${latest.price}/mo)`,
        severity: pct >= 20 ? 'critical' : 'warning',
      })
    } else if (diff < 0) {
      const pct = Math.round((Math.abs(diff) / previous.price) * 100)
      insights.push({
        type: 'price_decrease',
        message: `${tool.name} price dropped ${pct}% ($${previous.price} → $${latest.price}/mo)`,
        severity: 'info',
      })
    }
  }

  // 3. Check if cheaper alternatives exist in same category
  if (tool.category_id) {
    // Get user's current cost for this tool
    const { data: sub } = await supabase
      .from('user_subscriptions')
      .select('monthly_cost')
      .eq('user_id', user.id)
      .eq('tool_id', toolId)
      .single()

    if (sub && Number(sub.monthly_cost) > 0) {
      const userCost = Number(sub.monthly_cost)

      const { data: alternatives } = await supabase
        .from('tool_pricing_tiers')
        .select('tool_id, tier_name, monthly_price, tools:tool_id(name, slug, category_id, status)')
        .eq('tools.category_id', tool.category_id)
        .eq('tools.status', 'published')
        .gt('monthly_price', 0)
        .lt('monthly_price', userCost)
        .neq('tool_id', toolId)
        .order('monthly_price', { ascending: true })
        .limit(3) as { data: Array<{ tool_id: string; tier_name: string; monthly_price: number; tools: { name: string; slug: string; category_id: string; status: string } | null }> | null }

      const validAlts = (alternatives || []).filter(a => a.tools?.category_id === tool.category_id)
      if (validAlts.length > 0) {
        const cheapest = validAlts[0]
        const saving = Math.round(userCost - cheapest.monthly_price)
        insights.push({
          type: 'price_decrease',
          message: `${cheapest.tools!.name} (${cheapest.tier_name}) is $${saving}/mo cheaper than your ${tool.name} plan`,
          severity: saving >= 10 ? 'warning' : 'info',
          toolSlug: cheapest.tools!.slug,
        })
      }
    }

    // 4. Check for new tools in same category that are cheaper (last 30 days)
    if (sub && Number(sub.monthly_cost) > 0) {
      const { data: newCheaperTools } = await supabase
        .from('tools')
        .select('id, name, slug')
        .eq('category_id', tool.category_id)
        .eq('status', 'published')
        .neq('id', toolId)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(10)

      if (newCheaperTools && newCheaperTools.length > 0) {
        // Only alert about new tools that have a cheaper tier than user's current cost
        const userCost = Number(sub.monthly_cost)
        const newToolIds = newCheaperTools.map(t => t.id)
        const { data: newTiers } = await supabase
          .from('tool_pricing_tiers')
          .select('tool_id, monthly_price')
          .in('tool_id', newToolIds)
          .gt('monthly_price', 0)
          .lt('monthly_price', userCost)
          .limit(5) as { data: Array<{ tool_id: string; monthly_price: number }> | null }

        if (newTiers && newTiers.length > 0) {
          const cheaperToolIds = new Set(newTiers.map(t => t.tool_id))
          const cheaperNew = newCheaperTools.filter(t => cheaperToolIds.has(t.id)).slice(0, 1)
          for (const nt of cheaperNew) {
            const tier = newTiers.find(t => t.tool_id === nt.id)
            const saving = tier ? Math.round(userCost - tier.monthly_price) : 0
            insights.push({
              type: 'new_alternative',
              message: `${nt.name} just launched — $${saving}/mo cheaper than your ${tool.name} plan`,
              severity: 'info',
              toolSlug: nt.slug,
            })
          }
        }
      }
    }
  }

  return NextResponse.json({ insights })
}
