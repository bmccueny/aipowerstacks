import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const toolId = searchParams.get('tool_id')
  const since = searchParams.get('since')

  if (!toolId) return NextResponse.json({ history: [] })

  const supabase = createAdminClient()

  let query = supabase
    .from('tool_price_history')
    .select('price, recorded_at')
    .eq('tool_id', toolId)
    .order('recorded_at', { ascending: true })

  if (since) {
    query = query.gte('recorded_at', since)
  }

  const { data, error } = await query.limit(100)

  if (error) return NextResponse.json({ history: [] })
  return NextResponse.json({ history: data || [] })
}
