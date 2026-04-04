import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

// GET: Fetch changelog entries for tools the user tracks
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let toolIds: string[] = []

  if (user) {
    const admin = createAdminClient()
    const { data: subs } = await admin
      .from('user_subscriptions')
      .select('tool_id')
      .eq('user_id', user.id)
    toolIds = (subs || []).map((s: { tool_id: string }) => s.tool_id)
  } else {
    // Anon: accept tool_ids from query param
    const url = new URL(request.url)
    const idsParam = url.searchParams.get('tool_ids')
    if (idsParam) {
      toolIds = idsParam.split(',').filter(Boolean).slice(0, 20)
    }

    const ip = getClientIp(request)
    const { success } = rateLimit(`tracker:changelog:anon:${ip}`, 20, 60_000)
    if (!success) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }
  }

  if (toolIds.length === 0) return NextResponse.json({ entries: [] })

  const admin = createAdminClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

  const { data } = await admin
    .from('tool_changelog')
    .select('id, tool_id, event_type, title, summary, source_url, created_at, tools:tool_id(name, slug, logo_url)')
    .in('tool_id', toolIds)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ entries: data || [] })
}
