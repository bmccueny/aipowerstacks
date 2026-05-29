import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { tool_slug?: unknown; tool_id?: unknown; placement?: unknown }

  // Support both tool_slug (from OutboundLink) and tool_id (legacy)
  let toolId: string | null = typeof body.tool_id === 'string' ? body.tool_id : null

  if (!toolId && typeof body.tool_slug === 'string') {
    const admin = createAdminClient()
    const { data } = await admin
      .from('tools')
      .select('id')
      .eq('slug', body.tool_slug)
      .maybeSingle()
    toolId = data?.id ?? null
  }

  if (!toolId) return NextResponse.json({ error: 'tool_slug or tool_id required' }, { status: 400 })

  const referer = request.headers.get('referer')
  const page = referer ? new URL(referer).pathname : null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('affiliate_clicks').insert({
    tool_id: toolId,
    user_id: user?.id ?? null,
    page,
  })

  return NextResponse.json({ ok: true })
}
