import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia' as any,
    })
  : null

export async function GET(req: NextRequest) {
  const plan = req.nextUrl.searchParams.get('plan')
  if (plan !== 'pro') {
    return NextResponse.redirect(new URL('/pro', req.url))
  }

  if (!stripe) {
    return NextResponse.redirect(new URL('/pro?error=stripe-not-configured', req.url))
  }

  const proPriceId = process.env.STRIPE_PRO_PRICE_ID
  if (!proPriceId) {
    return NextResponse.redirect(new URL('/pro?error=pro-plan-not-configured', req.url))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login?redirectTo=/pro', req.url))
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: proPriceId, quantity: 1 }],
    metadata: { userId: user.id, plan: 'pro' },
    customer_email: user.email,
    subscription_data: { trial_period_days: 7 },
    success_url: `${baseUrl}/dashboard?upgraded=true`,
    cancel_url: `${baseUrl}/pro`,
  })

  return NextResponse.redirect(session.url!)
}

export async function POST(req: NextRequest) {
  if (!stripe || !process.env.STRIPE_PRICE_ID) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  const { toolSlug } = await req.json()

  if (!toolSlug || typeof toolSlug !== 'string') {
    return NextResponse.json({ error: 'toolSlug is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: tool } = await supabase
    .from('tools')
    .select('id, name, slug, status')
    .eq('slug', toolSlug.trim().toLowerCase())
    .eq('status', 'published')
    .single()

  if (!tool) {
    return NextResponse.json({ error: 'Tool not found or not published' }, { status: 404 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe!.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    metadata: { toolSlug: tool.slug, toolId: tool.id },
    success_url: `${baseUrl}/advertise/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/advertise`,
  })

  return NextResponse.json({ url: session.url })
}
