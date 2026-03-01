import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: challengeId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { collection_id } = await req.json()

  if (!collection_id) {
    return NextResponse.json({ error: 'collection_id required' }, { status: 400 })
  }

  const { data: collection } = await supabase
    .from('collections')
    .select('id, is_public, user_id')
    .eq('id', collection_id)
    .eq('user_id', user.id)
    .eq('is_public', true)
    .single()

  if (!collection) {
    return NextResponse.json({ error: 'Stack not found or is not public' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('challenge_submissions')
    .insert({ challenge_id: challengeId, collection_id, user_id: user.id })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already submitted' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
