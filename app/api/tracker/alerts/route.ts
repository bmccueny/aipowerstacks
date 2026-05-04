import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fromTable } from '@/lib/supabase/untyped'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const { data: alerts } = await fromTable(admin, 'tracker_alerts')
    .select('id, type, title, body, tool_id, severity, read, created_at')
    .eq('user_id', user.id)
    .gte('created_at', ninetyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ alerts: alerts ?? [] })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { alertId, read } = await request.json()
  if (!alertId) return NextResponse.json({ error: 'alertId required' }, { status: 400 })

  const admin = createAdminClient()
  await fromTable(admin, 'tracker_alerts')
    .update({ read: read ?? true })
    .eq('id', alertId)
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}

/** Create an alert for a user (called by crons and POST handlers) */
export async function createAlert(params: {
  userId: string
  type: 'usage_drop' | 'price_change' | 'cheaper_alternative' | 'overlap' | 'spend_milestone'
  title: string
  body: string
  toolId?: string
  severity?: 'info' | 'warning' | 'critical'
}) {
  const admin = createAdminClient()
  const { error } = await fromTable(admin, 'tracker_alerts').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    tool_id: params.toolId ?? null,
    severity: params.severity ?? 'info',
    read: false,
  })
  return !error
}
