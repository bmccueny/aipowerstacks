import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const profileData = profile as { role: string } | null
  if (profileData?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action, submission, rejection_reason } = await request.json()
  const admin = createAdminClient()

  if (action === 'approve') {
    const slug = submission.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const { data: tool } = await admin
      .from('tools')
      .insert({
        name: submission.name,
        slug,
        tagline: submission.tagline,
        description: submission.description,
        website_url: submission.website_url,
        category_id: submission.category_id ?? '00000000-0000-0000-0000-000000000000',
        pricing_model: submission.pricing_model ?? 'unknown',
        status: 'published',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    const toolData = tool as { id: string } | null

    await admin
      .from('tool_submissions')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        converted_tool_id: toolData?.id ?? null,
      })
      .eq('id', id)

    return NextResponse.json({ success: true, tool_id: toolData?.id })
  }

  if (action === 'reject') {
    await admin
      .from('tool_submissions')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejection_reason || null,
      })
      .eq('id', id)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
