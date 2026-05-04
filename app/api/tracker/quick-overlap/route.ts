import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

/*
 * Quick overlap detection for the homepage calculator.
 * Fast, rule-based (no AI call). Uses use_case + use_cases fields.
 * Accepts POST with tool IDs, returns overlap pairs.
 */

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const { success } = rateLimit(`quick-overlap:${ip}`, 30, 60_000)
  if (!success) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  let body: { tool_ids?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const toolIds = body.tool_ids
  if (!Array.isArray(toolIds) || toolIds.length < 2 || toolIds.length > 30) {
    return NextResponse.json({ overlaps: [] })
  }

  const admin = createAdminClient()
  const { data: tools } = await admin
    .from('tools')
    .select('id, name, slug, use_case, use_cases, category_id, tagline')
    .in('id', toolIds)
    .eq('status', 'published')

  if (!tools || tools.length < 2) {
    return NextResponse.json({ overlaps: [] })
  }

  type OverlapResult = {
    tools: [string, string]
    toolNames: [string, string]
    reason: string
    confidence: number
  }

  const overlaps: OverlapResult[] = []

  for (let i = 0; i < tools.length; i++) {
    for (let j = i + 1; j < tools.length; j++) {
      const a = tools[i]
      const b = tools[j]

      // Check use_case match
      if (a.use_case && b.use_case && a.use_case === b.use_case) {
        overlaps.push({
          tools: [a.slug, b.slug],
          toolNames: [a.name, b.name],
          reason: `Both are ${a.use_case} tools`,
          confidence: 80,
        })
        continue
      }

      // Check use_cases array overlap
      const aUc = a.use_cases || []
      const bUc = b.use_cases || []
      const shared = aUc.filter((uc: string) => bUc.includes(uc))
      if (shared.length > 0) {
        overlaps.push({
          tools: [a.slug, b.slug],
          toolNames: [a.name, b.name],
          reason: `Both do ${shared.slice(0, 2).join(' and ')}`,
          confidence: 60 + shared.length * 10,
        })
        continue
      }

      // Check same category
      if (a.category_id && b.category_id && a.category_id === b.category_id) {
        overlaps.push({
          tools: [a.slug, b.slug],
          toolNames: [a.name, b.name],
          reason: `Same category — may overlap`,
          confidence: 50,
        })
      }
    }
  }

  // Sort by confidence descending, take top 3
  overlaps.sort((a, b) => b.confidence - a.confidence)

  const res = NextResponse.json({ overlaps: overlaps.slice(0, 3) })
  res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  return res
}
