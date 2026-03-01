import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { following_id } = await req.json()

  if (!following_id || following_id === user.id) {
    return NextResponse.json({ error: 'Invalid following_id' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profile_follows')
    .insert({ follower_id: user.id, following_id })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const followingId = searchParams.get('followingId')

  if (!followingId) {
    return NextResponse.json({ error: 'followingId required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profile_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
