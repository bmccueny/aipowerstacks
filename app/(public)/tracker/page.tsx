import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string; import?: string }>
}) {
  const { add: addSlug, import: importParam } = await searchParams

  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    // Corrupted auth cookie
  }

  // Use admin client so anonymous users can browse tools too
  const adminSupabase = createAdminClient()
  const { data: tools } = await adminSupabase
    .from('tools')
    .select('id, name, slug, logo_url, pricing_model, pricing_details')
    .eq('status', 'published')
    .order('name')

  // Get popular tools for quick-add chips
  type PopularRow = { tool_id: string; tools: { id: string; name: string; slug: string; logo_url: string | null } }
  const { data: popularRaw } = await adminSupabase
    .from('user_subscriptions')
    .select('tool_id, tools!inner(id, name, slug, logo_url)')
    .limit(500) as { data: PopularRow[] | null }
  const toolCounts = new Map<string, { count: number; tool: { id: string; name: string; slug: string; logo_url: string | null } }>()
  for (const row of popularRaw ?? []) {
    const t = row.tools
    if (!t?.id) continue
    const existing = toolCounts.get(t.id)
    if (existing) { existing.count++ } else { toolCounts.set(t.id, { count: 1, tool: t }) }
  }
  const popularTools = [...toolCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 16)
    .map(e => e.tool)

  return (
    <div className="page-shell max-w-3xl mx-auto">
      <div className="page-hero text-center">
        <div className="inline-flex items-center gap-2 gum-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
          <DollarSign className="h-3.5 w-3.5" />
          Cost Tracker
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-2">AI Subscription Tracker</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Add your tools. We&apos;ll find the overlap, flag cheaper alternatives, and tell you what to cancel.
        </p>
      </div>

      <TrackerClient
        tools={(tools || []).map(t => ({ id: t.id, name: t.name, slug: t.slug, logo_url: t.logo_url, pricing_model: t.pricing_model || 'unknown', pricing_details: t.pricing_details, starting_price: null }))}
        popularTools={popularTools}
        autoAddSlug={addSlug}
        importTools={importParam}
        isLoggedIn={!!user}
      />
    </div>
  )
}
