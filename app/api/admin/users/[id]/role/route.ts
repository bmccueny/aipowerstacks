import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/supabase/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const updateRoleSchema = z.object({
  role: z.enum(['user', 'editor', 'admin']),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, error: authError } = await requireRole('admin')
  if (authError) return authError

  const body = await request.json()
  const parsed = updateRoleSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  if (id === user!.id && parsed.data.role !== 'admin') {
    return NextResponse.json({ error: 'You cannot remove your own admin role' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .update({
      role: parsed.data.role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, role')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ profile: data })
}
