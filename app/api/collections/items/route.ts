import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { collectionId, toolId } = await req.json()

    if (!collectionId || !toolId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Verify ownership
    const { data: collection } = await supabase
      .from('collections')
      .select('id')
      .eq('id', collectionId)
      .eq('user_id', user.id)
      .single()

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('collection_items')
      .insert({
        collection_id: collectionId,
        tool_id: toolId,
      })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already in collection' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding to collection:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const collectionId = searchParams.get('collectionId')
    const toolId = searchParams.get('toolId')

    if (!collectionId || !toolId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Verify ownership via RLS or explicit check
    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('tool_id', toolId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing from collection:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
