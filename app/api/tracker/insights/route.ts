import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const toolId = searchParams.get('tool_id')
  if (!toolId) return NextResponse.json({ insights: [] })

  // Per-tool insights are intentionally minimal. We don't suggest
  // tier downgrades or cheaper alternatives in isolation — that
  // requires overlap context which lives in the savings report.
  // This endpoint exists for future per-tool tips (e.g. "price
  // increased last month", "new competitor launched").
  return NextResponse.json({ insights: [] })
}
