import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Bookmark, Star, Send, ChevronRight, Layers, Globe, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'
import { DeleteStackButton } from '@/components/tools/DeleteStackButton'
import { CreateStackDialog } from '@/components/stacks/CreateStackDialog'

export const metadata: Metadata = { title: 'My Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [bookmarksRes, reviewsRes, submissionsRes, collectionsRes] = await Promise.all([
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
    supabase
      .from('collections')
      .select(`id, name, is_public, share_slug, collection_items(tools:tool_id(id, name, slug, logo_url))`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
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
  const collections = (collectionsRes.data ?? []) as unknown as {
    id: string; name: string; is_public: boolean; share_slug: string
    collection_items: { tools: { id: string; name: string; slug: string; logo_url: string | null } }[]
  }[]

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { icon: Layers, label: 'Power Stacks', count: collections.length, extra: `${collections.reduce((acc, c) => acc + c.collection_items.length, 0)} tools saved` },
          { icon: Bookmark, label: 'Saved Tools', count: bookmarks.length },
          { icon: Star, label: 'Reviews', count: reviews.length },
          { icon: Send, label: 'Submissions', count: submissions.length },
        ].map(({ icon: Icon, label, count, extra }: any) => (
          <div key={label} className="glass-card rounded-xl p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
              {extra && <p className="text-xs text-primary/70 mt-0.5">{extra}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2"><Layers className="h-5 w-5" /> My AI Power Stacks</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">Beta</span>
                <CreateStackDialog />
              </div>
            </h2>
            {collections.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center">
                <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">No stacks yet</p>
                <p className="text-xs text-muted-foreground mb-4">Save tools into named stacks from any tool page.</p>
                <Link href="/tools" className="text-xs font-semibold text-primary hover:underline">Browse tools →</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {collections.map((col) => {
                  const tools = col.collection_items.map(i => i.tools)
                  const avatars = tools.slice(0, 5)
                  const overflow = tools.length - avatars.length
                  return (
                    <Link key={col.id} href={`/dashboard/stacks/${col.id}`} className="block group">
                      <div className="glass-card rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
                        <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-70 group-hover:opacity-100 transition-opacity" />
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                <Layers className="h-4 w-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-[15px] leading-snug group-hover:text-primary transition-colors truncate">{col.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{tools.length} tool{tools.length !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 pt-0.5">
                              {col.is_public ? (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                  <Globe className="h-2.5 w-2.5" /> Public
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
                                  <Lock className="h-2.5 w-2.5" /> Private
                                </span>
                              )}
                              <DeleteStackButton collectionId={col.id} />
                            </div>
                          </div>

                          {tools.length === 0 ? (
                            <p className="text-xs text-muted-foreground/60 italic">Empty stack — add tools from any tool page.</p>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {avatars.map((tool, i) => (
                                  <div
                                    key={tool.id}
                                    title={tool.name}
                                    className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden shrink-0 shadow-sm"
                                    style={{ marginLeft: i === 0 ? 0 : '-8px', zIndex: avatars.length - i }}
                                  >
                                    {tool.logo_url ? (
                                      <Image src={tool.logo_url} alt={tool.name} width={32} height={32} className="object-cover" />
                                    ) : (
                                      <span className="text-[10px] font-black text-primary">{tool.name[0]}</span>
                                    )}
                                  </div>
                                ))}
                                {overflow > 0 && (
                                  <div
                                    className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm"
                                    style={{ marginLeft: '-8px' }}
                                  >
                                    +{overflow}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-semibold text-primary/70 group-hover:text-primary transition-colors flex items-center gap-1">
                                View stack <ChevronRight className="h-3 w-3" />
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

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
