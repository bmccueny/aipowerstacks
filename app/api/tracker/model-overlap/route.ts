import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const USE_CASES = ['coding', 'writing', 'research', 'image_generation', 'audio', 'video', 'design', 'chat'] as const
type UseCase = typeof USE_CASES[number]

type ModelRow = {
  model_name: string
  model_provider: string
  use_cases: string[]
  strength_score: number | null
  is_primary: boolean
  tools: {
    name: string
    slug: string
    monthly_cost: number
  } | null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch user's subscribed tool IDs
  const { data: subs } = await supabase
    .from('user_subscriptions')
    .select('tool_id, monthly_cost, tools:tool_id(name, slug)')
    .eq('user_id', user.id)

  if (!subs || subs.length === 0) {
    return NextResponse.json({ models: [], overlaps: [], coverage: buildEmptyCoverage() })
  }

  const toolIds = subs.map(s => s.tool_id)
  const costByToolId = new Map(subs.map(s => [s.tool_id, Number(s.monthly_cost)]))
  const toolMeta = new Map(subs.map(s => [s.tool_id, s.tools as { name: string; slug: string } | null]))

  // Fetch all model rows for those tools in one query
  const { data: modelRows } = await supabase
    .from('tool_models')
    .select('model_name, model_provider, use_cases, strength_score, is_primary, tool_id')
    .in('tool_id', toolIds)

  if (!modelRows || modelRows.length === 0) {
    return NextResponse.json({ models: [], overlaps: [], coverage: buildEmptyCoverage() })
  }

  // Group by model_name → list of tools that provide it
  const byModel = new Map<string, { provider: string; useCases: Set<string>; tools: Array<{ name: string; slug: string; cost: number; strength: number }> }>()

  for (const row of modelRows) {
    const meta = toolMeta.get(row.tool_id)
    if (!meta) continue
    const cost = costByToolId.get(row.tool_id) ?? 0

    if (!byModel.has(row.model_name)) {
      byModel.set(row.model_name, { provider: row.model_provider, useCases: new Set(row.use_cases || []), tools: [] })
    }
    const entry = byModel.get(row.model_name)!
    for (const uc of (row.use_cases || [])) entry.useCases.add(uc)
    entry.tools.push({ name: meta.name, slug: meta.slug, cost, strength: row.strength_score ?? 0 })
  }

  // Build models list
  const models = Array.from(byModel.entries()).map(([name, entry]) => ({
    name,
    provider: entry.provider,
    tools: entry.tools,
    useCases: Array.from(entry.useCases),
  }))

  // Overlaps = models accessed through 2+ tools
  const overlaps = models
    .filter(m => m.tools.length >= 2)
    .map(m => {
      const costs = m.tools.map(t => t.cost).sort((a, b) => a - b)
      // Cheapest tool likely covers the need; the rest are potential redundancy
      const potential_savings = costs.slice(1).reduce((s, c) => s + c, 0)
      return { model: m.name, tools: m.tools, potential_savings }
    })

  // Coverage: for each use-case, is there at least one model with strength >= 7?
  const coveredUseCases = new Set<string>()
  for (const row of modelRows) {
    if ((row.strength_score ?? 0) >= 7) {
      for (const uc of (row.use_cases || [])) coveredUseCases.add(uc)
    }
  }

  const coverage: Record<UseCase, number> = buildEmptyCoverage()
  for (const uc of USE_CASES) {
    coverage[uc] = coveredUseCases.has(uc) ? 100 : 0
  }

  return NextResponse.json({ models, overlaps, coverage })
}

function buildEmptyCoverage(): Record<UseCase, number> {
  return { coding: 0, writing: 0, research: 0, image_generation: 0, audio: 0, video: 0, design: 0, chat: 0 }
}
