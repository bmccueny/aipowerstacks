import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia' as any,
    })
  : null

export async function POST(req: NextRequest) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe!.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const toolSlug = session.metadata?.toolSlug

    if (toolSlug) {
      const supabase = createAdminClient()
      await supabase
        .from('tools')
        .update({ is_featured: true })
        .eq('slug', toolSlug)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const toolSlug = subscription.metadata?.toolSlug

    if (toolSlug) {
      const supabase = createAdminClient()
      await supabase
        .from('tools')
        .update({ is_featured: false })
        .eq('slug', toolSlug)
    }
  }

  return NextResponse.json({ received: true })
}
