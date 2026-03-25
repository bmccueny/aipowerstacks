import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const toolId = searchParams.get('tool_id')
  if (!toolId) return NextResponse.json({ tiers: [] })

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tool_pricing_tiers')
    .select('tier_name, monthly_price, features')
    .eq('tool_id', toolId)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ tiers: [] })
  return NextResponse.json({ tiers: data || [] })
}
