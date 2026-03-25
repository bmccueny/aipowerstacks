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
    .select('id, tool_id, monthly_cost, billing_cycle, created_at, tools:tool_id(name, slug, logo_url, pricing_model)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ subscriptions: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { tool_id, monthly_cost } = body

  if (!tool_id || !monthly_cost || monthly_cost <= 0) {
    return NextResponse.json({ error: 'tool_id and monthly_cost are required' }, { status: 400 })
  }

  const { data, error } = await subs(supabase)
    .upsert({
      user_id: user.id,
      tool_id,
      monthly_cost: parseFloat(monthly_cost),
    }, { onConflict: 'user_id,tool_id' })
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
