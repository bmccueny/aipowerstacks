import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET: Fetch usage check-in history for the current user
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Get last 12 weeks of check-ins
  const twelveWeeksAgo = new Date(Date.now() - 84 * 86400000).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('usage_checkins')
    .select('tool_id, week_start, used')
    .eq('user_id', user.id)
    .gte('week_start', twelveWeeksAgo)
    .order('week_start', { ascending: false })

  return NextResponse.json({ checkins: data || [] })
}

// POST: Submit a weekly check-in
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { responses } = body as { responses: Array<{ tool_id: string; used: boolean }> }

  if (!Array.isArray(responses)) {
    return NextResponse.json({ error: 'responses array required' }, { status: 400 })
  }

  // Calculate week start (Monday of current week)
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - diff)
  weekStart.setHours(0, 0, 0, 0)
  const weekStartStr = weekStart.toISOString().split('T')[0]

  const admin = createAdminClient()

  const rows = responses.map(r => ({
    user_id: user.id,
    tool_id: r.tool_id,
    week_start: weekStartStr,
    used: r.used,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('usage_checkins')
    .upsert(rows, { onConflict: 'user_id,tool_id,week_start' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, week: weekStartStr })
}
