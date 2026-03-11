import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/).optional(),
  tagline: z.string().min(1).max(150).optional(),
  description: z.string().min(1).max(5000).optional(),
  website_url: z.string().url().optional(),
  logo_url: z.string().url().nullable().optional(),
  category_id: z.string().uuid().optional(),
  pricing_model: z.enum(['free', 'freemium', 'paid', 'trial', 'contact', 'unknown']).optional(),
  pricing_details: z.string().max(200).nullable().optional(),
  use_case: z.string().max(80).nullable().optional(),
  team_size: z.string().max(80).nullable().optional(),
  integrations: z.array(z.string().max(80)).max(20).nullable().optional(),
  status: z.enum(['pending', 'published', 'rejected', 'archived']).optional(),
  is_verified: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  is_supertools: z.boolean().optional(),
  is_editors_pick: z.boolean().optional(),
  model_provider: z.string().max(50).nullable().optional(),
  is_api_wrapper: z.boolean().optional(),
  wrapper_details: z.string().max(500).nullable().optional(),
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
  if (!user || !await isAdmin(supabase, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('tools').update({
    ...parsed.data,
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await isAdmin(supabase, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { error } = await admin.from('tools').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
