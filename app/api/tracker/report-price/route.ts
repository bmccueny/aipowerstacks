import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const { success } = rateLimit(`report-price:${ip}`, 10, 60 * 60 * 1000)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await request.json()
  const { tool_id, tier_name, reported_price, actual_price_url } = body

  if (!tool_id || !tier_name || reported_price == null || reported_price < 0) {
    return NextResponse.json({ error: 'tool_id, tier_name, and reported_price are required' }, { status: 400 })
  }

  // Get current user — optional, reports are allowed anonymously
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()
  const { error } = await admin.from('pricing_reports').insert({
    tool_id,
    tier_name,
    reported_price: parseFloat(reported_price),
    actual_price_url: actual_price_url || null,
    reporter_id: user?.id ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
