import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const updateCategorySchema = z.object({
  name: z.string().min(1).max(80).optional(),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(240).nullable().optional(),
  icon: z.string().max(8).nullable().optional(),
  color: z.string().max(32).nullable().optional(),
  sort_order: z.number().int().min(0).max(9999).optional(),
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
  const parsed = updateCategorySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('categories')
    .update(parsed.data)
    .eq('id', id)
    .select('id, name, slug, description, icon, color, tool_count, sort_order')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ category: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await isAdmin(supabase, user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { count, error: countError } = await admin
    .from('tools')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)

  if (countError) return NextResponse.json({ error: countError.message }, { status: 400 })
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Cannot delete a category that still has tools' }, { status: 400 })
  }

  const { error } = await admin.from('categories').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
