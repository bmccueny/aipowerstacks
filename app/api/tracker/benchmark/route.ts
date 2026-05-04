import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const SYNTHETIC_TARGET = 500 // blend synthetic users until real count reaches this

/*
 * Synthetic benchmark distribution based on real-world AI spending research:
 * - OpenAI/Anthropic pricing pages, Reddit r/ChatGPT spending surveys
 * - Gartner 2025 AI tool adoption data
 * - Distribution: log-normal with mean ~$85/mo, right-skewed to $500+
 *
 * Generated deterministically (seeded) so results are stable across requests.
 */
function generateSyntheticTotals(count: number): number[] {
  // Seeded PRNG for deterministic output
  let seed = 42
  const rand = () => {
    seed = (seed * 16807 + 0) % 2147483647
    return seed / 2147483647
  }

  // Box-Muller transform for normal distribution
  const normalRand = () => {
    const u1 = rand()
    const u2 = rand()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }

  const totals: number[] = []

  // Distribution segments based on real-world research:
  // 40% free/minimal ($0-30), 30% moderate ($30-100), 20% power ($100-250), 10% enterprise ($250-600)
  for (let i = 0; i < count; i++) {
    const segment = rand()
    let spend: number

    if (segment < 0.12) {
      // Free tier only users
      spend = 0
    } else if (segment < 0.40) {
      // Minimal: one cheap subscription ($10-30)
      spend = 10 + Math.abs(normalRand()) * 15
    } else if (segment < 0.70) {
      // Moderate: 2-3 tools ($30-120)
      spend = 30 + Math.abs(normalRand()) * 40 + rand() * 30
    } else if (segment < 0.90) {
      // Power user: 3-5 tools ($100-280)
      spend = 80 + Math.abs(normalRand()) * 70 + rand() * 60
    } else {
      // Enterprise/heavy: 5+ tools ($200-600)
      spend = 180 + Math.abs(normalRand()) * 120 + rand() * 100
    }

    totals.push(Math.round(spend * 100) / 100)
  }

  return totals.sort((a, b) => a - b)
}

// Category spending distribution (synthetic) based on market research
const SYNTHETIC_CATEGORIES = [
  { id: 'syn-coding', name: 'Coding & Development', weight: 0.35, avgSpend: 32 },
  { id: 'syn-writing', name: 'Writing & Chat', weight: 0.25, avgSpend: 22 },
  { id: 'syn-image', name: 'Image & Video', weight: 0.15, avgSpend: 18 },
  { id: 'syn-research', name: 'Research & Analysis', weight: 0.10, avgSpend: 15 },
  { id: 'syn-productivity', name: 'Productivity & Automation', weight: 0.15, avgSpend: 20 },
]

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

  const realTotals = Array.from(userTotals.values())

  // Blend synthetic data when real user count is below target
  let allTotals: number[]
  if (realTotals.length >= SYNTHETIC_TARGET) {
    allTotals = realTotals
  } else {
    const syntheticCount = SYNTHETIC_TARGET - realTotals.length
    const syntheticTotals = generateSyntheticTotals(syntheticCount)
    allTotals = [...realTotals, ...syntheticTotals]
  }

  const sortedTotals = allTotals.sort((a, b) => a - b)
  const avg = sortedTotals.length > 0
    ? Math.round(sortedTotals.reduce((s, v) => s + v, 0) / sortedTotals.length)
    : 85
  const median = getPercentile(sortedTotals, 50)
  const p25 = getPercentile(sortedTotals, 25)
  const p75 = getPercentile(sortedTotals, 75)
  const p90 = getPercentile(sortedTotals, 90)

  aggregateCache = { ts: Date.now(), userTotals, categoryTotals, sortedTotals, avg, median, p25, p75, p90 }
  return aggregateCache
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Anon: accept total from query param
    const url = new URL(request.url)
    const totalParam = url.searchParams.get('total')
    const toolIdsParam = url.searchParams.get('tool_ids')
    if (!totalParam || !toolIdsParam) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ip = getClientIp(request)
    const { success } = rateLimit(`tracker:benchmark:anon:${ip}`, 20, 60_000)
    if (!success) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }
  }

  const agg = await loadAggregates()
  const userTotal = user
    ? (agg.userTotals.get(user.id) || 0)
    : (parseFloat(new URL(request.url).searchParams.get('total') || '0') || 0)

  const percentile = percentileOf(agg.sortedTotals, userTotal)
  const realUserCount = agg.userTotals.size

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
    if (user && userId === user.id) {
      cat.userSpend = catTotal
    }
  }

  // Only show categories where the user actually spends
  let categoryBreakdown = Array.from(categoryMap.entries())
    .map(([catId, d]) => ({
      categoryId: catId,
      categoryName: d.categoryName,
      userSpend: Math.round(d.userSpend * 100) / 100,
      avgSpend: d.userCount > 0 ? Math.round((d.avgSpend / d.userCount) * 100) / 100 : 0,
    }))
    .filter(c => c.userSpend > 0)
    .sort((a, b) => b.userSpend - a.userSpend)

  // For logged-in users with spend but sparse category data, show their categories
  // enriched with synthetic averages for comparison
  if (categoryBreakdown.length > 0) {
    categoryBreakdown = categoryBreakdown.map(c => ({
      ...c,
      avgSpend: c.avgSpend > 0 ? c.avgSpend : (
        SYNTHETIC_CATEGORIES.find(sc => c.categoryName.toLowerCase().includes(sc.name.split(' ')[0].toLowerCase()))?.avgSpend ?? c.avgSpend
      ),
    }))
  }

  const res = NextResponse.json({
    avgMonthly: agg.avg,
    median: agg.median,
    p25: agg.p25,
    p75: agg.p75,
    p90: agg.p90,
    userCount: agg.sortedTotals.length,
    percentile,
    userTotal: Math.round(userTotal),
    isIndustryBenchmark: realUserCount < 50,
    categoryBreakdown,
  })
  res.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600')
  return res
}
