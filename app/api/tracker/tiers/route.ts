import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const toolId = searchParams.get('tool_id')
  if (!toolId) return NextResponse.json({ tiers: [] })

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('tool_pricing_tiers')
    .select('tier_name, monthly_price, features')
    .eq('tool_id', toolId)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ tiers: [] })
  return NextResponse.json({ tiers: data || [] })
}
