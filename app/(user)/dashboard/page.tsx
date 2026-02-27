import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Bookmark, Star, Send, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'

export const metadata: Metadata = { title: 'My Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [bookmarksRes, reviewsRes, submissionsRes] = await Promise.all([
    supabase
      .from('bookmarks')
      .select(`tool_id, tools (id, name, slug, tagline, logo_url, pricing_model)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('reviews')
      .select(`id, rating, title, created_at, tools (id, name, slug)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('tool_submissions')
      .select('id, name, status, created_at')
      .eq('submitted_by', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const bookmarks = (bookmarksRes.data ?? []) as unknown as {
    tool_id: string
    tools: { id: string; name: string; slug: string; tagline: string; logo_url: string | null; pricing_model: string }
  }[]
  const reviews = (reviewsRes.data ?? []) as unknown as {
    id: string; rating: number; title: string | null; created_at: string
    tools: { id: string; name: string; slug: string }
  }[]
  const submissions = (submissionsRes.data ?? []) as { id: string; name: string; status: string; created_at: string }[]

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { icon: Bookmark, label: 'Saved Tools', count: bookmarks.length },
          { icon: Star, label: 'Reviews Written', count: reviews.length },
          { icon: Send, label: 'Tools Submitted', count: submissions.length },
        ].map(({ icon: Icon, label, count }) => (
          <div key={label} className="glass-card rounded-xl p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Bookmark className="h-5 w-5" /> Saved Tools
          </h2>
          {bookmarks.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-center text-muted-foreground text-sm">
              No saved tools yet.{' '}
              <Link href="/tools" className="text-primary hover:underline">Browse tools</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {bookmarks.map(({ tools: tool }) => {
                const pricingColor = PRICING_BADGE_COLORS[tool.pricing_model] ?? PRICING_BADGE_COLORS.unknown
                const pricingLabel = PRICING_LABELS[tool.pricing_model] ?? 'Unknown'
                return (
                  <Link key={tool.id} href={`/tools/${tool.slug}`} className="block">
                    <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 hover:border-primary/30 transition-colors group">
                      <div className="h-9 w-9 shrink-0 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                        {tool.logo_url ? (
                          <Image src={tool.logo_url} alt={tool.name} width={36} height={36} className="object-cover" />
                        ) : (
                          <span className="font-bold text-primary text-sm">{tool.name[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{tool.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{tool.tagline}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs shrink-0 ${pricingColor}`}>{pricingLabel}</Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5" /> My Reviews
            </h2>
            {reviews.length === 0 ? (
              <div className="glass-card rounded-xl p-6 text-center text-muted-foreground text-sm">
                No reviews yet.
              </div>
            ) : (
              <div className="space-y-2">
                {reviews.map((review) => (
                  <Link key={review.id} href={`/tools/${review.tools.slug}`} className="block">
                    <div className="glass-card rounded-xl px-4 py-3 flex items-center justify-between hover:border-primary/30 transition-colors">
                      <div>
                        <p className="font-medium text-sm">{review.tools.name}</p>
                        {review.title && <p className="text-xs text-muted-foreground">{review.title}</p>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {'★'.repeat(review.rating)}<span className="text-muted-foreground">{'★'.repeat(5 - review.rating)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Send className="h-5 w-5" /> My Submissions
            </h2>
            {submissions.length === 0 ? (
              <div className="glass-card rounded-xl p-6 text-center text-muted-foreground text-sm">
                No submissions yet.{' '}
                <Link href="/submit" className="text-primary hover:underline">Submit a tool</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {submissions.map((sub) => (
                  <div key={sub.id} className="glass-card rounded-xl px-4 py-3 flex items-center justify-between">
                    <p className="font-medium text-sm">{sub.name}</p>
                    <Badge variant="outline" className={`text-xs ${statusColors[sub.status] ?? ''}`}>
                      {sub.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
