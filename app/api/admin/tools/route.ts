import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const toolSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  tagline: z.string().min(1).max(150),
  description: z.string().min(1).max(5000),
  website_url: z.string().url(),
  logo_url: z.string().url().nullable().optional(),
  category_id: z.string().uuid(),
  pricing_model: z.enum(['free', 'freemium', 'paid', 'trial', 'contact', 'unknown']).default('unknown'),
  pricing_details: z.string().max(200).nullable().optional(),
  use_case: z.string().max(80).nullable().optional(),
  team_size: z.string().max(80).nullable().optional(),
  integrations: z.array(z.string().max(80)).max(20).nullable().optional(),
  status: z.enum(['pending', 'published', 'rejected', 'archived']).default('published'),
  is_verified: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  is_supertools: z.boolean().default(false),
  is_editors_pick: z.boolean().default(false),
})

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
  return (data as { role: string } | null)?.role === 'admin'
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await isAdmin(supabase, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = toolSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('tools').insert({
    ...parsed.data,
    submitted_by: user.id,
    approved_by: user.id,
    approved_at: new Date().toISOString(),
    published_at: parsed.data.status === 'published' ? new Date().toISOString() : null,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ tool: data })
}
