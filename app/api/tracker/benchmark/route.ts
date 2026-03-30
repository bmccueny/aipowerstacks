import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Industry benchmarks when we don't have enough users for real data
const INDUSTRY_AVG = 150
const INDUSTRY_TEAM_AVG = 245
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

// In-memory aggregate cache
type AggregateCache = {
  ts: number
  userTotals: Map<string, number>
  categoryTotals: Map<string, { userId: string; categoryId: string; categoryName: string; total: number }[]>
  sortedTotals: number[]
  avg: number
  median: number
  p25: number
  p75: number
  p90: number
}

let aggregateCache: AggregateCache | null = null

function percentileOf(sorted: number[], value: number): number {
  if (sorted.length === 0) return 50
  const below = sorted.filter(v => v < value).length
  return Math.round((below / sorted.length) * 100)
}

function getPercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))]
}

async function loadAggregates(): Promise<AggregateCache> {
  if (aggregateCache && Date.now() - aggregateCache.ts < CACHE_TTL_MS) {
    return aggregateCache
  }

  const admin = createAdminClient()

  // Fetch all subscriptions with category info
  const { data: allSubs } = await admin
    .from('user_subscriptions')
    .select('user_id, monthly_cost, tools!inner(category_id, categories(name))')

  const userTotals = new Map<string, number>()
  const categoryTotals: Map<string, { userId: string; categoryId: string; categoryName: string; total: number }[]> = new Map()

  if (allSubs) {
    for (const sub of allSubs) {
      const cost = Number(sub.monthly_cost)
      const uid = sub.user_id
      userTotals.set(uid, (userTotals.get(uid) || 0) + cost)

      // Category breakdown
      const tool = sub.tools as unknown as { category_id: string | null; categories: { name: string } | null }
      const catId = tool?.category_id
      const catName = tool?.categories?.name || 'Other'
      if (catId) {
        const key = `${uid}::${catId}`
        if (!categoryTotals.has(key)) {
          categoryTotals.set(key, [])
        }
        categoryTotals.get(key)!.push({ userId: uid, categoryId: catId, categoryName: catName, total: cost })
      }
    }
  }

  const sortedTotals = Array.from(userTotals.values()).sort((a, b) => a - b)
  const avg = sortedTotals.length > 0
    ? Math.round(sortedTotals.reduce((s, v) => s + v, 0) / sortedTotals.length)
    : INDUSTRY_AVG
  const median = getPercentile(sortedTotals, 50)
  const p25 = getPercentile(sortedTotals, 25)
  const p75 = getPercentile(sortedTotals, 75)
  const p90 = getPercentile(sortedTotals, 90)

  aggregateCache = { ts: Date.now(), userTotals, categoryTotals, sortedTotals, avg, median, p25, p75, p90 }
  return aggregateCache
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agg = await loadAggregates()
  const userTotal = agg.userTotals.get(user.id) || 0

  // Not enough users — return industry benchmark
  if (agg.sortedTotals.length < 5) {
    const percentile = userTotal > INDUSTRY_AVG ? 65 : userTotal < INDUSTRY_AVG * 0.5 ? 25 : 50
    return NextResponse.json({
      avgMonthly: INDUSTRY_AVG,
      median: INDUSTRY_AVG,
      p25: Math.round(INDUSTRY_AVG * 0.6),
      p75: Math.round(INDUSTRY_AVG * 1.4),
      p90: INDUSTRY_TEAM_AVG,
      userCount: agg.sortedTotals.length,
      percentile,
      userTotal: Math.round(userTotal),
      isIndustryBenchmark: true,
      categoryBreakdown: [],
    })
  }

  const percentile = percentileOf(agg.sortedTotals, userTotal)

  // Build category breakdown: user spend vs average per category
  const categoryMap = new Map<string, { categoryName: string; userSpend: number; avgSpend: number; userCount: number }>()

  // Aggregate all users' category spending
  for (const [key, entries] of agg.categoryTotals) {
    const catId = key.split('::')[1]
    const userId = key.split('::')[0]
    const catTotal = entries.reduce((s, e) => s + e.total, 0)
    const catName = entries[0]?.categoryName || 'Other'

    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, { categoryName: catName, userSpend: 0, avgSpend: 0, userCount: 0 })
    }
    const cat = categoryMap.get(catId)!
    cat.avgSpend += catTotal
    cat.userCount += 1
    if (userId === user.id) {
      cat.userSpend = catTotal
    }
  }

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([catId, data]) => ({
      categoryId: catId,
      categoryName: data.categoryName,
      userSpend: Math.round(data.userSpend * 100) / 100,
      avgSpend: data.userCount > 0 ? Math.round((data.avgSpend / data.userCount) * 100) / 100 : 0,
    }))
    .filter(c => c.userSpend > 0 || c.avgSpend > 0)
    .sort((a, b) => b.userSpend - a.userSpend)

  return NextResponse.json({
    avgMonthly: agg.avg,
    median: agg.median,
    p25: agg.p25,
    p75: agg.p75,
    p90: agg.p90,
    userCount: agg.sortedTotals.length,
    percentile,
    userTotal: Math.round(userTotal),
    isIndustryBenchmark: false,
    categoryBreakdown,
  })
}
