import Link from 'next/link'
import { Zap, Star, Newspaper, ArrowRight } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SITE_URL } from '@/lib/constants/site'

export const metadata = {
  title: 'AI Changelog | Weekly Updates | AIPowerStacks',
  description: 'Weekly digest of new AI tools, reviews, and updates on AIPowerStacks. Stay on top of the AI tools landscape.',
  alternates: { canonical: '/changelog' },
  openGraph: {
    title: 'AI Changelog | AIPowerStacks',
    description: 'Weekly digest of new AI tools, reviews, and updates.',
    url: `${SITE_URL}/changelog`,
  },
}

type WeekEntry = {
  weekLabel: string
  weekStart: string
  newTools: Array<{ name: string; slug: string; tagline: string | null; logo_url: string | null }>
  newReviews: Array<{ toolName: string; toolSlug: string; rating: number; editorName: string | null }>
  newPosts: Array<{ title: string; slug: string }>
  toolCount: number
  reviewCount: number
  postCount: number
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - d.getUTCDay()) // Sunday start
  return d
}

function formatWeekLabel(date: Date): string {
  const end = new Date(date)
  end.setUTCDate(end.getUTCDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${date.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}, ${end.getUTCFullYear()}`
}

export default async function ChangelogPage() {
  const supabase = createAdminClient()
  const sixWeeksAgo = new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: tools }, { data: reviews }, { data: posts }] = await Promise.all([
    supabase
      .from('tools')
      .select('name, slug, tagline, logo_url, published_at')
      .eq('status', 'published')
      .gte('published_at', sixWeeksAgo)
      .order('published_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('rating, created_at, tool_id, user_id')
      .eq('status', 'published')
      .eq('is_verified', true)
      .gte('created_at', sixWeeksAgo)
      .order('created_at', { ascending: false }),
    supabase
      .from('blog_posts')
      .select('title, slug, published_at')
      .eq('status', 'published')
      .gte('published_at', sixWeeksAgo)
      .order('published_at', { ascending: false }),
  ])

  // Fetch tool names for reviews
  const reviewToolIds = [...new Set((reviews ?? []).map(r => r.tool_id).filter(Boolean))]
  const reviewUserIds = [...new Set((reviews ?? []).map(r => r.user_id).filter(Boolean))]

  const [{ data: reviewToolsData }, { data: reviewProfilesData }] = await Promise.all([
    reviewToolIds.length > 0
      ? supabase.from('tools').select('id, name, slug').in('id', reviewToolIds)
      : Promise.resolve({ data: [] as any[] }),
    reviewUserIds.length > 0
      ? supabase.from('profiles').select('id, display_name').in('id', reviewUserIds)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const toolMap = new Map((reviewToolsData ?? []).map((t: any) => [t.id, t]))
  const profileMap = new Map((reviewProfilesData ?? []).map((p: any) => [p.id, p]))

  // Group by week
  const weekMap = new Map<string, WeekEntry>()

  function getOrCreateWeek(dateStr: string): WeekEntry {
    const ws = getWeekStart(new Date(dateStr))
    const key = ws.toISOString()
    if (!weekMap.has(key)) {
      weekMap.set(key, {
        weekLabel: formatWeekLabel(ws),
        weekStart: key,
        newTools: [],
        newReviews: [],
        newPosts: [],
        toolCount: 0,
        reviewCount: 0,
        postCount: 0,
      })
    }
    return weekMap.get(key)!
  }

  for (const tool of tools ?? []) {
    if (!tool.published_at) continue
    const week = getOrCreateWeek(tool.published_at)
    week.newTools.push({ name: tool.name, slug: tool.slug, tagline: tool.tagline, logo_url: tool.logo_url })
    week.toolCount++
  }

  for (const review of reviews ?? []) {
    const week = getOrCreateWeek(review.created_at)
    const tool = toolMap.get(review.tool_id)
    const profile = profileMap.get(review.user_id)
    if (tool) {
      week.newReviews.push({
        toolName: tool.name,
        toolSlug: tool.slug,
        rating: review.rating,
        editorName: profile?.display_name ?? null,
      })
      week.reviewCount++
    }
  }

  for (const post of posts ?? []) {
    if (!post.published_at) continue
    const week = getOrCreateWeek(post.published_at)
    week.newPosts.push({ title: post.title, slug: post.slug })
    week.postCount++
  }

  const weeks = [...weekMap.values()].sort((a, b) => b.weekStart.localeCompare(a.weekStart))

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">AI Changelog</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              A weekly digest of new tools, editor reviews, and updates across the AI tools landscape.
            </p>
          </div>

          {weeks.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-xl">
              <p className="text-muted-foreground">No activity in the last 6 weeks.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {weeks.map((week) => (
                <div key={week.weekStart} className="relative">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-3 w-3 rounded-full bg-primary shrink-0" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      {week.weekLabel}
                    </h2>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="ml-6 space-y-4">
                    {/* New Tools */}
                    {week.newTools.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5 mb-2">
                          <Zap className="h-3.5 w-3.5" /> {week.toolCount} New Tool{week.toolCount !== 1 ? 's' : ''}
                        </p>
                        <div className="space-y-1.5">
                          {week.newTools.slice(0, 8).map((tool) => (
                            <Link
                              key={tool.slug}
                              href={`/tools/${tool.slug}`}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                            >
                              <div className="h-8 w-8 rounded-md bg-muted overflow-hidden flex items-center justify-center shrink-0">
                                {tool.logo_url ? (
                                  <img src={tool.logo_url} alt={tool.name} width={32} height={32} className="object-contain" />
                                ) : (
                                  <span className="text-xs font-bold text-primary">{tool.name[0]}</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="text-sm font-semibold group-hover:text-primary transition-colors">{tool.name}</span>
                                {tool.tagline && <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">{tool.tagline}</span>}
                              </div>
                            </Link>
                          ))}
                          {week.newTools.length > 8 && (
                            <p className="text-xs text-muted-foreground pl-2">+{week.newTools.length - 8} more</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Reviews */}
                    {week.newReviews.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5 mb-2">
                          <Star className="h-3.5 w-3.5" /> {week.reviewCount} Editor Review{week.reviewCount !== 1 ? 's' : ''}
                        </p>
                        <div className="space-y-1">
                          {week.newReviews.slice(0, 6).map((review, i) => (
                            <Link
                              key={`${review.toolSlug}-${i}`}
                              href={`/tools/${review.toolSlug}`}
                              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                            >
                              <span className="text-amber-500 font-bold">{review.rating}*</span>
                              <span className="font-medium">{review.toolName}</span>
                              {review.editorName && <span className="text-xs text-muted-foreground">by {review.editorName}</span>}
                            </Link>
                          ))}
                          {week.newReviews.length > 6 && (
                            <p className="text-xs text-muted-foreground pl-2">+{week.newReviews.length - 6} more</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Blog Posts */}
                    {week.newPosts.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 mb-2">
                          <Newspaper className="h-3.5 w-3.5" /> {week.postCount} Blog Post{week.postCount !== 1 ? 's' : ''}
                        </p>
                        <div className="space-y-1">
                          {week.newPosts.map((post) => (
                            <Link
                              key={post.slug}
                              href={`/blog/${post.slug}`}
                              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-sm group"
                            >
                              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="font-medium group-hover:text-primary transition-colors">{post.title}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
