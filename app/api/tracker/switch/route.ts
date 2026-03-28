import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST: Record a tool switch (user dropped tool A, added tool B)
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { from_tool_id, to_tool_id, reason, satisfaction } = body

  if (!from_tool_id || !to_tool_id) {
    return NextResponse.json({ error: 'from_tool_id and to_tool_id required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('tool_switches')
    .insert({
      user_id: user.id,
      from_tool_id,
      to_tool_id,
      reason: reason || null,
      satisfaction: satisfaction || null,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// GET: Get switch stats for tools the user tracks
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Get aggregate switch data for popular tools
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('tool_switches')
    .select('from_tool_id, to_tool_id, satisfaction, tools_from:from_tool_id(name, slug), tools_to:to_tool_id(name, slug)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (!data) return NextResponse.json({ switches: [] })

  // Aggregate: count switches per pair
  const pairs = new Map<string, { from: string; to: string; fromSlug: string; toSlug: string; count: number; avgSatisfaction: number }>()
  for (const s of data) {
    const key = `${s.from_tool_id}→${s.to_tool_id}`
    const existing = pairs.get(key)
    if (existing) {
      existing.count++
      if (s.satisfaction) existing.avgSatisfaction = (existing.avgSatisfaction * (existing.count - 1) + s.satisfaction) / existing.count
    } else {
      pairs.set(key, {
        from: s.tools_from?.name || '?',
        to: s.tools_to?.name || '?',
        fromSlug: s.tools_from?.slug || '',
        toSlug: s.tools_to?.slug || '',
        count: 1,
        avgSatisfaction: s.satisfaction || 0,
      })
    }
  }

  return NextResponse.json({
    switches: [...pairs.values()].sort((a, b) => b.count - a.count).slice(0, 20),
  })
}
