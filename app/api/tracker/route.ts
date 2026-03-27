import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// user_subscriptions table is not in generated types yet, use untyped queries
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function subs(supabase: any) { return supabase.from('user_subscriptions') }

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await subs(supabase)
    .select('id, tool_id, monthly_cost, billing_cycle, created_at, use_tags, tools:tool_id(name, slug, logo_url, pricing_model, use_case, category_id, categories:category_id(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Annotate each subscription with whether it's on a usage-based (API/token) tier
  // so the client can exclude them from overlap comparisons
  const toolIds = (data || []).map((s: { tool_id: string }) => s.tool_id)
  if (toolIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tiers } = await (supabase as any)
      .from('tool_pricing_tiers')
      .select('tool_id, tier_name, monthly_price')
      .in('tool_id', toolIds)

    if (tiers) {
      const usageTiersByTool = new Map<string, { price: number; name: string }[]>()
      for (const t of tiers) {
        const lower = (t.tier_name || '').toLowerCase()
        if (lower.includes('api') || lower.includes('token')) {
          const list = usageTiersByTool.get(t.tool_id) || []
          list.push({ price: t.monthly_price, name: t.tier_name })
          usageTiersByTool.set(t.tool_id, list)
        }
      }
      for (const sub of data as { tool_id: string; monthly_cost: number; is_usage_based?: boolean }[]) {
        const usageTiers = usageTiersByTool.get(sub.tool_id)
        if (usageTiers?.some(t => t.price === Number(sub.monthly_cost))) {
          sub.is_usage_based = true
        }
      }
    }
  }

  return NextResponse.json({ subscriptions: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { tool_id, monthly_cost, use_tags } = body

  if (!tool_id || monthly_cost == null || monthly_cost < 0) {
    return NextResponse.json({ error: 'tool_id and monthly_cost are required' }, { status: 400 })
  }

  const row: Record<string, unknown> = {
    user_id: user.id,
    tool_id,
    monthly_cost: parseFloat(monthly_cost),
  }
  if (Array.isArray(use_tags) && use_tags.length > 0) {
    row.use_tags = use_tags
  }

  const { data, error } = await subs(supabase)
    .upsert(row, { onConflict: 'user_id,tool_id' })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await subs(supabase)
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
