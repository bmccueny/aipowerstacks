import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

export async function POST(req: NextRequest) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const toolSlug = session.metadata?.toolSlug

    if (toolSlug) {
      const { error } = await supabase
        .from('tools')
        .update({ is_featured: true })
        .eq('slug', toolSlug)

      if (error) {
        console.error('Stripe webhook: failed to feature tool', toolSlug, error.message)
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }
    } else if (session.metadata?.plan === 'pro' && session.metadata?.userId) {
      const { error } = await supabase
        .from('profiles')
        .update({ plan: 'pro' })
        .eq('id', session.metadata.userId)
      if (error) {
        console.error('Stripe webhook: failed to upgrade user to pro', session.metadata.userId, error.message)
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const toolSlug = subscription.metadata?.toolSlug

    if (toolSlug) {
      const { error } = await supabase
        .from('tools')
        .update({ is_featured: false })
        .eq('slug', toolSlug)

      if (error) {
        console.error('Stripe webhook: failed to unfeature tool', toolSlug, error.message)
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }
    } else if (subscription.metadata?.plan === 'pro') {
      // Find user by looking up the Stripe customer
      // For now, log it — we'd need customer_id mapping
      console.log('Stripe webhook: pro subscription cancelled, customer:', subscription.customer)
    }
  }

  return NextResponse.json({ received: true })
}
