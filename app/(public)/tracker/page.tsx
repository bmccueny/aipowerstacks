import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DollarSign } from 'lucide-react'
import { TrackerClient } from '@/components/tracker/TrackerClient'
import { SITE_URL } from '@/lib/constants/site'

export const metadata: Metadata = {
  title: 'AI Subscription Tracker | AIPowerStacks',
  description: 'Track your AI tool subscriptions in one place. See your total monthly spend, find duplicates, and cut costs.',
  alternates: { canonical: '/tracker' },
  openGraph: {
    title: 'AI Subscription Tracker',
    description: 'Track your AI tool subscriptions in one place. See your total monthly spend and cut costs.',
    url: `${SITE_URL}/tracker`,
    type: 'website',
  },
}

export default async function TrackerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/tracker')
  }

  // Get all tools for the search picker
  const { data: tools } = await supabase
    .from('tools')
    .select('id, name, slug, logo_url, pricing_model, pricing_details')
    .eq('status', 'published')
    .order('name')

  return (
    <div className="page-shell max-w-3xl mx-auto">
      <div className="page-hero text-center">
        <div className="inline-flex items-center gap-2 gum-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
          <DollarSign className="h-3.5 w-3.5" />
          Cost Tracker
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-2">AI Subscription Tracker</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Track every AI tool you pay for. See your total monthly spend at a glance.
        </p>
      </div>

      <TrackerClient tools={(tools || []).map(t => ({ id: t.id, name: t.name, slug: t.slug, logo_url: t.logo_url, pricing_model: t.pricing_model || 'unknown', pricing_details: t.pricing_details, starting_price: null }))} />
    </div>
  )
}
