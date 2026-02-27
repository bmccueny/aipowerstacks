import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { toolId } = await request.json()
  if (!toolId) return NextResponse.json({ error: 'toolId required' }, { status: 400 })

  const { error } = await supabase
    .from('bookmarks')
    .insert({ user_id: user.id, tool_id: toolId })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const toolId = searchParams.get('toolId')
  if (!toolId) return NextResponse.json({ error: 'toolId required' }, { status: 400 })

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', user.id)
    .eq('tool_id', toolId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ bookmarks: [] })

  const { data } = await supabase
    .from('bookmarks')
    .select('tool_id')
    .eq('user_id', user.id)

  return NextResponse.json({ bookmarks: data?.map((b) => b.tool_id) ?? [] })
}
