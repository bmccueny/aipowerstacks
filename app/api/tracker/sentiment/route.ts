import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

/*
 * Community Pulse — per-tool sentiment scoring
 *
 * Score (0-100) = weighted composite of:
 *   Rating     (50%) — avg_rating normalized, confidence-weighted by review_count
 *   Popularity (25%) — percentile rank of tracking count among all tools
 *   Retention  (25%) — inverse of switch-away rate from tool_switches
 */

const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

type GlobalStats = {
  ts: number
  trackingCounts: Map<string, number>    // toolId -> count of users tracking
  switchAwayCounts: Map<string, number>  // toolId -> count of switches FROM this tool
  switchToCounts: Map<string, number>    // toolId -> count of switches TO this tool
  sortedTrackingCounts: number[]         // for percentile calculation
  toolMeta: Map<string, { name: string; slug: string; logoUrl: string | null; avgRating: number; reviewCount: number }>
}

let globalCache: GlobalStats | null = null

function percentileRank(sorted: number[], value: number): number {
  if (sorted.length === 0) return 50
  const below = sorted.filter(v => v < value).length
  return Math.round((below / sorted.length) * 100)
}

function computePulse(
  avgRating: number,
  reviewCount: number,
  trackingPercentile: number,
  switchAwayCount: number,
  switchToCount: number,
): number {
  // Rating score (0-100), confidence-weighted
  const rawRating = (avgRating / 5) * 100
  const confidence = Math.min(Math.log2(reviewCount + 1) / 5, 1) // 0-1, saturates at ~32 reviews
  const ratingScore = reviewCount === 0
    ? 60 // neutral default for unreviewed tools
    : rawRating * (0.5 + 0.5 * confidence) // ranges from 50% to 100% of raw rating

  // Popularity score (0-100) — direct percentile
  const popularityScore = trackingPercentile

  // Retention score (0-100) — inverse of switch-away rate
  const totalSwitchEvents = switchAwayCount + switchToCount
  let retentionScore = 70 // neutral default
  if (totalSwitchEvents > 0) {
    const retentionRate = switchToCount / totalSwitchEvents // 0-1, higher = people switch TO this tool
    retentionScore = Math.round(retentionRate * 100)
  }

  const pulse = Math.round(
    ratingScore * 0.50 +
    popularityScore * 0.25 +
    retentionScore * 0.25
  )

  return Math.max(0, Math.min(100, pulse))
}

function pulseLabel(score: number): string {
  if (score >= 80) return 'Strong'
  if (score >= 60) return 'Solid'
  if (score >= 40) return 'Mixed'
  return 'Weak'
}

function pulseColor(score: number): string {
  if (score >= 80) return 'emerald'
  if (score >= 60) return 'blue'
  if (score >= 40) return 'amber'
  return 'red'
}

async function loadGlobalStats(): Promise<GlobalStats> {
  if (globalCache && Date.now() - globalCache.ts < CACHE_TTL_MS) {
    return globalCache
  }

  const admin = createAdminClient()

  // Load all subscriptions to count tracking popularity
  const { data: allSubs } = await admin
    .from('user_subscriptions')
    .select('tool_id')

  const trackingCounts = new Map<string, number>()
  if (allSubs) {
    for (const sub of allSubs) {
      trackingCounts.set(sub.tool_id, (trackingCounts.get(sub.tool_id) || 0) + 1)
    }
  }

  const sortedTrackingCounts = Array.from(trackingCounts.values()).sort((a, b) => a - b)

  // Load switch data
  const { data: switches } = await admin
    .from('tool_switches')
    .select('from_tool_id, to_tool_id')

  const switchAwayCounts = new Map<string, number>()
  const switchToCounts = new Map<string, number>()
  if (switches) {
    for (const sw of switches) {
      switchAwayCounts.set(sw.from_tool_id, (switchAwayCounts.get(sw.from_tool_id) || 0) + 1)
      switchToCounts.set(sw.to_tool_id, (switchToCounts.get(sw.to_tool_id) || 0) + 1)
    }
  }

  // Load tool metadata
  const { data: tools } = await admin
    .from('tools')
    .select('id, name, slug, logo_url, avg_rating, review_count')
    .eq('status', 'published')

  const toolMeta = new Map<string, { name: string; slug: string; logoUrl: string | null; avgRating: number; reviewCount: number }>()
  if (tools) {
    for (const t of tools) {
      toolMeta.set(t.id, {
        name: t.name,
        slug: t.slug,
        logoUrl: t.logo_url,
        avgRating: t.avg_rating ?? 0,
        reviewCount: t.review_count ?? 0,
      })
    }
  }

  globalCache = { ts: Date.now(), trackingCounts, switchAwayCounts, switchToCounts, sortedTrackingCounts, toolMeta }
  return globalCache
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let toolIds: string[]

  if (user) {
    // Logged-in: get their tracked tools
    const { data: subs } = await supabase
      .from('user_subscriptions')
      .select('tool_id')
      .eq('user_id', user.id)

    toolIds = subs?.map(s => s.tool_id) ?? []
  } else {
    // Anonymous: accept tool_ids from query
    const url = new URL(request.url)
    const idsParam = url.searchParams.get('tool_ids')
    if (!idsParam) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ip = getClientIp(request)
    const { success } = rateLimit(`tracker:sentiment:anon:${ip}`, 20, 60_000)
    if (!success) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }

    toolIds = idsParam.split(',').filter(Boolean).slice(0, 30)
  }

  if (toolIds.length === 0) {
    return NextResponse.json({ tools: [], stackPulse: 0, stackLabel: 'Unknown' })
  }

  const stats = await loadGlobalStats()

  const toolScores = toolIds.map(toolId => {
    const meta = stats.toolMeta.get(toolId)
    if (!meta) return null

    const trackingCount = stats.trackingCounts.get(toolId) || 0
    const trackingPercentile = percentileRank(stats.sortedTrackingCounts, trackingCount)
    const switchAway = stats.switchAwayCounts.get(toolId) || 0
    const switchTo = stats.switchToCounts.get(toolId) || 0

    const pulse = computePulse(
      meta.avgRating,
      meta.reviewCount,
      trackingPercentile,
      switchAway,
      switchTo,
    )

    return {
      toolId,
      name: meta.name,
      slug: meta.slug,
      logoUrl: meta.logoUrl,
      pulse,
      label: pulseLabel(pulse),
      color: pulseColor(pulse),
      avgRating: Math.round(meta.avgRating * 10) / 10,
      reviewCount: meta.reviewCount,
      trackingCount,
      signals: {
        rating: Math.round((meta.avgRating / 5) * 100),
        popularity: trackingPercentile,
        retention: switchAway + switchTo > 0
          ? Math.round((switchTo / (switchAway + switchTo)) * 100)
          : 70,
      },
    }
  }).filter((t): t is NonNullable<typeof t> => t != null)

  // Stack-level pulse = weighted average of tool pulses
  const stackPulse = toolScores.length > 0
    ? Math.round(toolScores.reduce((sum, t) => sum + t.pulse, 0) / toolScores.length)
    : 0

  return NextResponse.json({
    tools: toolScores.sort((a, b) => a.pulse - b.pulse), // worst first for attention
    stackPulse,
    stackLabel: pulseLabel(stackPulse),
    stackColor: pulseColor(stackPulse),
    toolCount: toolScores.length,
  })
}
