import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const USE_CASES = ['coding', 'writing', 'research', 'image_generation', 'audio', 'video', 'design', 'chat'] as const
type UseCase = typeof USE_CASES[number]

type ModelRowDb = {
  tool_id: string
  model_name: string
  model_provider: string
  use_cases: string[]
  strength_score: number | null
  is_primary: boolean
}

function buildEmptyCoverage(): Record<UseCase, number> {
  return { coding: 0, writing: 0, research: 0, image_generation: 0, audio: 0, video: 0, design: 0, chat: 0 }
}

function computeModelOverlap(
  costByToolId: Map<string, number>,
  toolMeta: Map<string, { name: string; slug: string } | null>,
  modelRows: ModelRowDb[]
) {
  // Group by model_name → list of tools that provide it
  const byModel = new Map<string, {
    provider: string
    useCases: Set<string>
    tools: Array<{ name: string; slug: string; cost: number; strength: number }>
  }>()

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

  return { models, overlaps, coverage }
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

  const typedSubs = (subs || []) as unknown as { tool_id: string; monthly_cost: number; tools: { name: string; slug: string } | null }[]
  if (typedSubs.length === 0) {
    return NextResponse.json({ models: [], overlaps: [], coverage: buildEmptyCoverage() })
  }

  const toolIds = typedSubs.map(s => s.tool_id)
  const costByToolId = new Map(typedSubs.map(s => [s.tool_id, Number(s.monthly_cost)]))
  const toolMeta = new Map(typedSubs.map(s => [s.tool_id, s.tools]))

  const { data: modelRows } = await supabase
    .from('tool_models')
    .select('model_name, model_provider, use_cases, strength_score, is_primary, tool_id')
    .in('tool_id', toolIds)

  if (!modelRows || modelRows.length === 0) {
    return NextResponse.json({ models: [], overlaps: [], coverage: buildEmptyCoverage() })
  }

  return NextResponse.json(computeModelOverlap(costByToolId, toolMeta, modelRows as unknown as ModelRowDb[]))
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const { success } = rateLimit(`tracker:model-overlap:anon:${ip}`, 10)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const tools = (body as { tools?: unknown }).tools
  if (!Array.isArray(tools) || tools.length < 2 || tools.length > 50) {
    return NextResponse.json({ error: 'tools must be an array of 2–50 items' }, { status: 400 })
  }

  const items = tools as { tool_id?: unknown; monthly_cost?: unknown }[]
  if (!items.every(t => typeof t.tool_id === 'string' && UUID_RE.test(t.tool_id) && typeof t.monthly_cost === 'number')) {
    return NextResponse.json({ error: 'Each tool must have a valid UUID tool_id and numeric monthly_cost' }, { status: 400 })
  }

  const validTools = items as { tool_id: string; monthly_cost: number }[]
  const toolIds = validTools.map(t => t.tool_id)

  const admin = createAdminClient()

  const [{ data: toolRows, error: toolsError }, { data: modelRows, error: modelsError }] = await Promise.all([
    admin.from('tools').select('id, name, slug').in('id', toolIds),
    admin.from('tool_models')
      .select('model_name, model_provider, use_cases, strength_score, is_primary, tool_id')
      .in('tool_id', toolIds),
  ])

  if (toolsError) return NextResponse.json({ error: toolsError.message }, { status: 500 })
  if (modelsError) return NextResponse.json({ error: modelsError.message }, { status: 500 })

  if (!modelRows || modelRows.length === 0) {
    return NextResponse.json({ models: [], overlaps: [], coverage: buildEmptyCoverage() })
  }

  const costByToolId = new Map(validTools.map(t => [t.tool_id, t.monthly_cost]))
  const toolMeta = new Map((toolRows ?? []).map(t => [t.id, { name: t.name, slug: t.slug }]))

  return NextResponse.json(computeModelOverlap(costByToolId, toolMeta, modelRows as unknown as ModelRowDb[]))
}
