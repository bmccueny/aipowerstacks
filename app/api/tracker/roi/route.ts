import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type ROIEntry = {
  toolId: string
  toolName: string
  toolSlug: string
  logoUrl: string | null
  monthlyCost: number
  weeksTracked: number
  weeksUsed: number
  usageRate: number
  costPerUse: number | null
  roi: 'high' | 'medium' | 'low'
  suggestion: string | null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Fetch user subscriptions
  const { data: subs } = await admin
    .from('user_subscriptions')
    .select('tool_id, monthly_cost, tools!inner(id, name, slug, logo_url)')
    .eq('user_id', user.id)

  if (!subs || subs.length === 0) {
    return NextResponse.json({ tools: [], summary: null })
  }

  // Fetch last 12 weeks of checkins
  const twelveWeeksAgo = new Date(Date.now() - 84 * 86400000).toISOString()
  const { data: checkins } = await admin
    .from('usage_checkins')
    .select('tool_id, week_start, used')
    .eq('user_id', user.id)
    .gte('week_start', twelveWeeksAgo)

  // Build checkin map: tool_id -> { weeksTracked, weeksUsed }
  const checkinMap = new Map<string, { tracked: Set<string>; used: number }>()
  if (checkins) {
    for (const c of checkins) {
      if (!checkinMap.has(c.tool_id)) {
        checkinMap.set(c.tool_id, { tracked: new Set(), used: 0 })
      }
      const entry = checkinMap.get(c.tool_id)!
      entry.tracked.add(c.week_start)
      if (c.used) entry.used += 1
    }
  }

  const results: ROIEntry[] = []
  let totalMonthly = 0
  let lowRoiCount = 0
  let potentialSavings = 0

  for (const sub of subs) {
    const tool = sub.tools as unknown as { id: string; name: string; slug: string; logo_url: string | null }
    const cost = Number(sub.monthly_cost)
    totalMonthly += cost

    const usage = checkinMap.get(sub.tool_id)
    const weeksTracked = usage ? usage.tracked.size : 0
    const weeksUsed = usage ? usage.used : 0
    const usageRate = weeksTracked > 0 ? weeksUsed / weeksTracked : 0

    // Cost per use: monthly cost / (4.33 weeks * usage rate)
    // Simplified: if used 100% of weeks, cost-per-use = monthly_cost / 4.33
    const weeklyUsesPerMonth = usageRate * 4.33
    const costPerUse = weeklyUsesPerMonth > 0 ? cost / weeklyUsesPerMonth : null

    // ROI classification
    let roi: 'high' | 'medium' | 'low' = 'medium'
    let suggestion: string | null = null

    if (weeksTracked < 2) {
      // Not enough data
      roi = 'medium'
      suggestion = 'Check in weekly to track ROI'
    } else if (cost > 10 && usageRate < 0.25) {
      roi = 'low'
      suggestion = `Used only ${Math.round(usageRate * 100)}% of weeks — consider canceling to save $${cost}/mo`
      lowRoiCount += 1
      potentialSavings += cost
    } else if (cost === 0 || usageRate >= 0.75) {
      roi = 'high'
    } else if (usageRate >= 0.5) {
      roi = 'medium'
    } else if (cost <= 10) {
      roi = 'medium'
      suggestion = `Low usage but affordable — keep an eye on it`
    } else {
      roi = 'low'
      suggestion = `Used ${Math.round(usageRate * 100)}% of weeks at $${cost}/mo`
      lowRoiCount += 1
      potentialSavings += cost
    }

    results.push({
      toolId: sub.tool_id,
      toolName: tool.name,
      toolSlug: tool.slug,
      logoUrl: tool.logo_url,
      monthlyCost: cost,
      weeksTracked,
      weeksUsed,
      usageRate: Math.round(usageRate * 100),
      costPerUse: costPerUse !== null ? Math.round(costPerUse * 100) / 100 : null,
      roi,
      suggestion,
    })
  }

  // Sort: low ROI first, then by cost descending
  results.sort((a, b) => {
    const roiOrder = { low: 0, medium: 1, high: 2 }
    if (roiOrder[a.roi] !== roiOrder[b.roi]) return roiOrder[a.roi] - roiOrder[b.roi]
    return b.monthlyCost - a.monthlyCost
  })

  return NextResponse.json({
    tools: results,
    summary: {
      totalMonthly,
      lowRoiCount,
      potentialSavings: Math.round(potentialSavings * 100) / 100,
      highRoiCount: results.filter(r => r.roi === 'high').length,
    },
  })
}
