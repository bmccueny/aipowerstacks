import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function subs(supabase: any) { return supabase.from('user_subscriptions') }

// Industry benchmarks when we don't have enough users for real data
const INDUSTRY_AVG = 89 // typical individual AI spend/mo
const INDUSTRY_TEAM_AVG = 245 // typical team AI spend/mo

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: allSubs } = await subs(supabase)
    .select('user_id, monthly_cost')

  if (!allSubs || allSubs.length === 0) {
    return NextResponse.json({ avgMonthly: INDUSTRY_AVG, userCount: 0, percentile: 50, userTotal: 0, isIndustryBenchmark: true })
  }

  // Group by user, sum monthly cost
  const userTotals = new Map<string, number>()
  for (const sub of allSubs) {
    const current = userTotals.get(sub.user_id) || 0
    userTotals.set(sub.user_id, current + Number(sub.monthly_cost))
  }

  const userTotal = userTotals.get(user.id) || 0

  // Exclude current user from the benchmark pool
  const otherTotals = Array.from(userTotals.entries())
    .filter(([id]) => id !== user.id)
    .map(([, total]) => total)
    .sort((a, b) => a - b)

  // Need at least 5 other users for meaningful benchmarks
  if (otherTotals.length < 5) {
    // Use industry benchmark instead
    const percentile = userTotal > INDUSTRY_AVG ? 65 : userTotal < INDUSTRY_AVG * 0.5 ? 25 : 50
    return NextResponse.json({
      avgMonthly: INDUSTRY_AVG,
      userCount: otherTotals.length,
      percentile,
      userTotal: Math.round(userTotal),
      isIndustryBenchmark: true,
    })
  }

  const avgMonthly = Math.round(otherTotals.reduce((s, v) => s + v, 0) / otherTotals.length)
  const belowCount = otherTotals.filter(t => t < userTotal).length
  const percentile = Math.round((belowCount / otherTotals.length) * 100)

  return NextResponse.json({
    avgMonthly,
    userCount: otherTotals.length,
    percentile,
    userTotal: Math.round(userTotal),
    isIndustryBenchmark: false,
  })
}
