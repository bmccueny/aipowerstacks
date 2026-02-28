import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z.object({
  status: z.enum(['draft', 'pending', 'published']),
  rejectionReason: z.string().max(500).optional(),
})

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
  return (data as { role: string } | null)?.role === 'admin'
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !await isAdmin(supabase, user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const admin = createAdminClient()
  const payload = {
    status: parsed.data.status,
    moderated_by: user.id,
    moderated_at: new Date().toISOString(),
    rejection_reason: parsed.data.status === 'draft' ? (parsed.data.rejectionReason ?? null) : null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin
    .from('reviews')
    .update(payload)
    .eq('id', id)
    .select('id, status')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ review: data })
}
