import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET: Fetch changelog entries for tools the user tracks
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Get user's tracked tool IDs
  const { data: subs } = await admin
    .from('user_subscriptions')
    .select('tool_id')
    .eq('user_id', user.id)

  const toolIds = (subs || []).map((s: { tool_id: string }) => s.tool_id)
  if (toolIds.length === 0) return NextResponse.json({ entries: [] })

  // Get recent changelog entries for those tools (last 30 days)
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
