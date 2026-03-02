import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(220).regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().min(1).max(300).optional(),
  content: z.string().min(1).optional(),
  cover_image_url: z.string().url().nullable().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  is_featured: z.boolean().optional(),
  video_embed_url: z.string().url().nullable().optional(),
  reading_time_min: z.number().int().min(1).nullable().optional(),
})

async function isStaff(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
  const role = (data as { role: string } | null)?.role
  return role === 'admin' || role === 'editor'
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await isStaff(supabase, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updates: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() }
  if (parsed.data.status === 'published') {
    const { data: existing } = await createAdminClient().from('blog_posts').select('published_at').eq('id', id).single()
    const existingData = existing as { published_at: string | null } | null
    if (!existingData?.published_at) updates.published_at = new Date().toISOString()
  }

  const admin = createAdminClient()
  const { error } = await admin.from('blog_posts').update(updates).eq('id', id)
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
  if (!user || !await isStaff(supabase, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { error } = await admin.from('blog_posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
