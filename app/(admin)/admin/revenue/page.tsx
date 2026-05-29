import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { DollarSign, MousePointerClick, TrendingUp } from 'lucide-react'

export const revalidate = 0

export const metadata: Metadata = { title: 'Revenue Dashboard' }

export default async function RevenueDashboardPage() {
  const supabase = createAdminClient()

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString()

  // Affiliate clicks this month and this week
  const [monthClicks, weekClicks, featuredTools, clicksByTool] = await Promise.all([
    supabase
      .from('affiliate_clicks')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo),
    supabase
      .from('affiliate_clicks')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo),
    supabase
      .from('tools')
      .select('id, name, slug')
      .eq('is_featured', true),
    supabase
      .from('affiliate_clicks')
      .select('tool_id, tools!inner(name, slug, affiliate_commission_pct)')
      .gte('created_at', thirtyDaysAgo),
  ])

  // Aggregate clicks by tool
  type ClickRow = { tool_id: string; tools: { name: string; slug: string; affiliate_commission_pct: number | null } }
  const toolClickMap = new Map<string, { name: string; slug: string; clicks: number; commission: number | null }>()
  for (const row of (clicksByTool.data ?? []) as unknown as ClickRow[]) {
    const existing = toolClickMap.get(row.tool_id)
    if (existing) {
      existing.clicks++
    } else {
      toolClickMap.set(row.tool_id, {
        name: row.tools.name,
        slug: row.tools.slug,
        clicks: 1,
        commission: row.tools.affiliate_commission_pct,
      })
    }
  }
  const topTools = [...toolClickMap.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 10)

  // Estimated revenue: clicks × 2% conversion × $20 avg order × commission%
  const estimatedRevenue = topTools.reduce((sum, t) => {
    if (!t.commission) return sum
    return sum + t.clicks * 0.02 * 20 * (t.commission / 100)
  }, 0)

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-semibold mb-6">Revenue Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <MousePointerClick className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Clicks (30d)</span>
          </div>
          <p className="text-2xl font-bold">{monthClicks.count ?? 0}</p>
        </div>
        <div className="glass-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <MousePointerClick className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Clicks (7d)</span>
          </div>
          <p className="text-2xl font-bold">{weekClicks.count ?? 0}</p>
        </div>
        <div className="glass-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-muted-foreground">Est. Revenue (30d)</span>
          </div>
          <p className="text-2xl font-bold">${estimatedRevenue.toFixed(2)}</p>
        </div>
        <div className="glass-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium text-muted-foreground">Featured Listings</span>
          </div>
          <p className="text-2xl font-bold">{featuredTools.data?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">
            ${((featuredTools.data?.length ?? 0) * 99)}/mo
          </p>
        </div>
      </div>

      {/* Top affiliate tools */}
      <div className="glass-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-bold">Top Affiliate Clicks (30 days)</h2>
        </div>
        {topTools.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No affiliate clicks yet. Add affiliate URLs to tools in the admin panel.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-5 py-3 font-medium">Tool</th>
                <th className="px-5 py-3 font-medium text-right">Clicks</th>
                <th className="px-5 py-3 font-medium text-right">Commission</th>
                <th className="px-5 py-3 font-medium text-right">Est. Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topTools.map((t) => (
                <tr key={t.slug} className="border-b border-border/50 last:border-0">
                  <td className="px-5 py-3 font-medium">{t.name}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{t.clicks}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{t.commission ? `${t.commission}%` : '—'}</td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {t.commission ? `$${(t.clicks * 0.02 * 20 * t.commission / 100).toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Featured listing details */}
      {(featuredTools.data?.length ?? 0) > 0 && (
        <div className="glass-card rounded-xl border border-border overflow-hidden mt-6">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-bold">Active Featured Listings</h2>
          </div>
          <div className="divide-y divide-border/50">
            {featuredTools.data?.map((t) => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                <span className="font-medium">{t.name}</span>
                <span className="text-xs text-emerald-500 font-bold">$99/mo</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
