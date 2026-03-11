import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const submitSchema = z.object({
  name: z.string().min(1).max(100),
  website_url: z.string().url(),
  tagline: z.string().min(1).max(150),
  description: z.string().min(20).max(2000),
  category_id: z.string().uuid().optional().or(z.literal('')),
  pricing_model: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  submitter_email: z.string().email().optional().or(z.literal('')),
  notes: z.string().max(500).optional(),
  model_provider: z.string().max(50).optional().or(z.literal('')),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required. Please log in to submit a tool.' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, website_url, tagline, description, category_id, pricing_model, logo_url, submitter_email, notes, model_provider } = parsed.data

  const { error } = await supabase
    .from('tool_submissions')
    .insert({
      name,
      website_url,
      tagline,
      description,
      category_id: category_id || null,
      pricing_model: pricing_model || null,
      logo_url: logo_url || null,
      submitter_email: submitter_email || null,
      notes: notes || null,
      model_provider: model_provider || null,
      submitted_by: user.id,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
