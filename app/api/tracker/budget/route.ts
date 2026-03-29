import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const ip = getClientIp(request)
  const { success } = rateLimit(`tracker:budget:get:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('monthly_budget')
    .eq('id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ monthly_budget: profile?.monthly_budget ?? null })
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const { success } = rateLimit(`tracker:budget:post:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { monthly_budget } = body

  if (monthly_budget !== null && (typeof monthly_budget !== 'number' || monthly_budget < 0)) {
    return NextResponse.json({ error: 'monthly_budget must be a positive number or null' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ monthly_budget: monthly_budget ?? null })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ monthly_budget })
}
