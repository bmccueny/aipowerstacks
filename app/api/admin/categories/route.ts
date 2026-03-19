import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/supabase/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const createCategorySchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(240).nullable().optional(),
  icon: z.string().max(8).nullable().optional(),
  color: z.string().max(32).nullable().optional(),
  sort_order: z.number().int().min(0).max(9999).default(0),
})

export async function POST(request: Request) {
  const { error: authError } = await requireRole('admin')
  if (authError) return authError

  const body = await request.json()
  const parsed = createCategorySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('categories')
    .insert({
      ...parsed.data,
      description: parsed.data.description ?? null,
      icon: parsed.data.icon ?? null,
      color: parsed.data.color ?? null,
    })
    .select('id, name, slug, description, icon, color, tool_count, sort_order')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ category: data })
}
