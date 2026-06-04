import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fromTable } from '@/lib/supabase/untyped'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createAdminClient()

  // Get tool ID from slug
  const { data: tool } = await supabase
    .from('tools')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!tool) return NextResponse.json({ history: [] })

  // Get last 90 days of price history
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: history } = await fromTable(supabase, 'pricing_history')
    .select('tier_name, monthly_price, snapshot_date')
    .eq('tool_id', tool.id)
    .gte('snapshot_date', ninetyDaysAgo)
    .order('snapshot_date', { ascending: true })

  return NextResponse.json({ history: history ?? [] }, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
  })
}
