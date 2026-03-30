import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const MIN_OVERLAP = 3

type CohortCache = {
  ts: number
  userTools: Map<string, Set<string>> // userId -> Set<toolId>
  toolNames: Map<string, { name: string; slug: string; logoUrl: string | null }>
}

let cohortCache: CohortCache | null = null

async function loadCohortData(): Promise<CohortCache> {
  if (cohortCache && Date.now() - cohortCache.ts < CACHE_TTL_MS) {
    return cohortCache
  }

  const admin = createAdminClient()

  const { data: allSubs } = await admin
    .from('user_subscriptions')
    .select('user_id, tool_id, tools!inner(name, slug, logo_url, status)')
    .eq('tools.status', 'published')

  const userTools = new Map<string, Set<string>>()
  const toolNames = new Map<string, { name: string; slug: string; logoUrl: string | null }>()

  if (allSubs) {
    for (const sub of allSubs) {
      if (!userTools.has(sub.user_id)) {
        userTools.set(sub.user_id, new Set())
      }
      userTools.get(sub.user_id)!.add(sub.tool_id)

      const tool = sub.tools as unknown as { name: string; slug: string; logo_url: string | null }
      if (!toolNames.has(sub.tool_id)) {
        toolNames.set(sub.tool_id, { name: tool.name, slug: tool.slug, logoUrl: tool.logo_url })
      }
    }
  }

  cohortCache = { ts: Date.now(), userTools, toolNames }
  return cohortCache
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cache = await loadCohortData()
  const myTools = cache.userTools.get(user.id)

  if (!myTools || myTools.size < 2) {
    return NextResponse.json({ cohortSize: 0, recommendations: [], message: 'Add more tools to see cohort insights' })
  }

  // Find users with 3+ overlapping tools
  const cohortUsers: string[] = []
  const recommendationCounts = new Map<string, number>()

  for (const [otherId, otherTools] of cache.userTools) {
    if (otherId === user.id) continue

    // Count overlap
    let overlap = 0
    for (const toolId of myTools) {
      if (otherTools.has(toolId)) overlap++
    }

    if (overlap >= MIN_OVERLAP) {
      cohortUsers.push(otherId)

      // Find tools they have that the user doesn't
      for (const toolId of otherTools) {
        if (!myTools.has(toolId)) {
          recommendationCounts.set(toolId, (recommendationCounts.get(toolId) || 0) + 1)
        }
      }
    }
  }

  // Sort recommendations by frequency, take top 5
  const recommendations = Array.from(recommendationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([toolId, count]) => {
      const info = cache.toolNames.get(toolId)
      return {
        toolId,
        toolName: info?.name || 'Unknown',
        toolSlug: info?.slug || '',
        logoUrl: info?.logoUrl || null,
        usedByCount: count,
        cohortPercentage: cohortUsers.length > 0
          ? Math.round((count / cohortUsers.length) * 100)
          : 0,
      }
    })
    .filter(r => r.cohortPercentage >= 20) // Only show if 20%+ of cohort uses it

  return NextResponse.json({
    cohortSize: cohortUsers.length,
    recommendations,
    message: cohortUsers.length > 0
      ? `Found ${cohortUsers.length} users with similar stacks`
      : 'Not enough similar users yet — check back as more people join',
  })
}
