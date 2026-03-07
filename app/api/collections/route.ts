import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await req.json()
    const { name, description, is_public, icon, template_id } = payload

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const share_slug = crypto.randomBytes(6).toString('hex')

    const { data, error } = await supabase
      .from('collections')
      .insert({
        user_id: user.id,
        name,
        icon,
        description,
        is_public: is_public ?? false,
        share_slug,
        template_id: template_id ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating collection:', error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error creating collection:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      items:collection_items(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
