import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const postSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(220).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().min(1).max(300),
  content: z.string().min(1),
  cover_image_url: z.string().url().nullable().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  is_featured: z.boolean().default(false),
  video_embed_url: z.string().url().nullable().optional(),
  reading_time_min: z.number().int().min(1).nullable().optional(),
})

async function isStaff(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
  const role = (data as { role: string } | null)?.role
  return role === 'admin' || role === 'editor'
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await isStaff(supabase, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('blog_posts').insert({
    ...parsed.data,
    author_id: user.id,
    published_at: parsed.data.status === 'published' ? new Date().toISOString() : null,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ post: data })
}
