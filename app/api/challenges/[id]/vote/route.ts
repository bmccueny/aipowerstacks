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

  const { data: existing } = await supabase
    .from('challenge_votes')
    .select('collection_id')
    .eq('challenge_id', challengeId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing?.collection_id === collection_id) {
    await supabase
      .from('challenge_votes')
      .delete()
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)

    const { count } = await supabase
      .from('challenge_votes')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)
      .eq('collection_id', collection_id)

    await supabase
      .from('challenge_submissions')
      .update({ vote_count: count ?? 0 })
      .eq('challenge_id', challengeId)
      .eq('collection_id', collection_id)

    return NextResponse.json({ voted: false })
  }

  if (existing) {
    await supabase
      .from('challenge_votes')
      .update({ collection_id })
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)
  } else {
    const { error } = await supabase
      .from('challenge_votes')
      .insert({ challenge_id: challengeId, collection_id, user_id: user.id })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const { count } = await supabase
    .from('challenge_votes')
    .select('*', { count: 'exact', head: true })
    .eq('challenge_id', challengeId)
    .eq('collection_id', collection_id)

  await supabase
    .from('challenge_submissions')
    .update({ vote_count: count ?? 0 })
    .eq('challenge_id', challengeId)
    .eq('collection_id', collection_id)

  return NextResponse.json({ voted: true })
}
