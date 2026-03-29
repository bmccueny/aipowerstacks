import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import crypto from 'crypto'

function generateShareId(): string {
  return crypto.randomBytes(8).toString('base64url')
}

type SnapshotTool = {
  name: string
  slug: string
  logo_url: string | null
  pricing_model: string
  monthly_cost: number
  category: string | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id parameter required' }, { status: 400 })
  }

  const ip = getClientIp(request)
  const { success } = rateLimit(`tracker:share:get:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // Public read — use admin client to bypass RLS for simplicity
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('shared_stacks')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Stack not found' }, { status: 404 })
  }

  return NextResponse.json({ stack: data })
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const { success } = rateLimit(`tracker:share:post:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch user's current subscriptions
  const { data: subs, error: subsError } = await supabase
    .from('user_subscriptions')
    .select('tool_id, monthly_cost, tools:tool_id(name, slug, logo_url, pricing_model, categories:category_id(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (subsError) return NextResponse.json({ error: subsError.message }, { status: 500 })
  if (!subs || subs.length === 0) {
    return NextResponse.json({ error: 'No subscriptions to share' }, { status: 400 })
  }

  // Fetch user profile for display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('id', user.id)
    .single()

  const displayName = profile?.display_name || profile?.username || null

  // Build snapshot
  const snapshot: SnapshotTool[] = (subs as unknown as Array<{
    tool_id: string
    monthly_cost: number
    tools: { name: string; slug: string; logo_url: string | null; pricing_model: string; categories: { name: string } | null } | null
  }>).map(s => ({
    name: s.tools?.name || 'Unknown',
    slug: s.tools?.slug || '',
    logo_url: s.tools?.logo_url || null,
    pricing_model: s.tools?.pricing_model || 'unknown',
    monthly_cost: Number(s.monthly_cost),
    category: s.tools?.categories?.name || null,
  }))

  const totalMonthly = snapshot.reduce((sum, t) => sum + t.monthly_cost, 0)

  // Fetch stack score grade
  let grade: string | null = null
  if (subs.length >= 2) {
    try {
      const scoreRes = await fetch(new URL('/api/tracker/score', request.url).toString(), {
        headers: { cookie: request.headers.get('cookie') || '' },
      })
      if (scoreRes.ok) {
        const scoreData = await scoreRes.json()
        grade = scoreData.grade || null
      }
    } catch { /* score fetch failed, that's fine */ }
  }

  // Check if user already has a shared stack
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('shared_stacks')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  const shareId = existing?.id || generateShareId()

  const { error: upsertError } = await admin
    .from('shared_stacks')
    .upsert({
      id: shareId,
      user_id: user.id,
      display_name: displayName,
      snapshot: snapshot as unknown as Record<string, unknown>,
      total_monthly: totalMonthly,
      tool_count: snapshot.length,
      grade,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  return NextResponse.json({ id: shareId, url: `/stack/${shareId}` })
}
