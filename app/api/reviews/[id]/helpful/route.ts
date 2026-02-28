import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: current, error: loadError } = await admin
    .from('reviews')
    .select('id, helpful_count')
    .eq('id', id)
    .single()

  if (loadError || !current) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  const { data, error } = await admin
    .from('reviews')
    .update({
      helpful_count: (current.helpful_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, helpful_count')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ review: data })
}
