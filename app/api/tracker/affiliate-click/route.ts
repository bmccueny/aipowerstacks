import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { tool_id?: unknown }
  const tool_id = typeof body.tool_id === 'string' ? body.tool_id : null
  if (!tool_id) return NextResponse.json({ error: 'tool_id required' }, { status: 400 })

  const referer = request.headers.get('referer')
  const page = referer ? new URL(referer).pathname : null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('affiliate_clicks').insert({
    tool_id,
    user_id: user?.id ?? null,
    page,
  })

  return NextResponse.json({ ok: true })
}
