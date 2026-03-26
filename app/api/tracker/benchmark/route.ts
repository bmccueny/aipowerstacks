import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function subs(supabase: any) { return supabase.from('user_subscriptions') }

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all users' monthly totals for benchmarking
  const { data: allSubs } = await subs(supabase)
    .select('user_id, monthly_cost')

  if (!allSubs || allSubs.length === 0) {
    return NextResponse.json({ avgMonthly: 89, userCount: 0, percentile: 50 })
  }

  // Group by user, sum monthly cost
  const userTotals = new Map<string, number>()
  for (const sub of allSubs) {
    const current = userTotals.get(sub.user_id) || 0
    userTotals.set(sub.user_id, current + Number(sub.monthly_cost))
  }

  const totals = Array.from(userTotals.values()).sort((a, b) => a - b)
  const avgMonthly = Math.round(totals.reduce((s, v) => s + v, 0) / totals.length)
  const userTotal = userTotals.get(user.id) || 0

  // Calculate percentile — what % of users spend less than this user
  const belowCount = totals.filter(t => t < userTotal).length
  const percentile = totals.length > 1 ? Math.round((belowCount / totals.length) * 100) : 50

  return NextResponse.json({
    avgMonthly,
    userCount: totals.length,
    percentile,
    userTotal: Math.round(userTotal),
  })
}
