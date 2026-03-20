import { Star, Layers, Zap } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { DiscoverCarousel } from './DiscoverCarousel'

export type FeedItem = {
  id: string
  type: 'new_tool' | 'new_review' | 'trending_stack'
  title: string
  subtitle: string
  href: string
  icon: 'tool' | 'review' | 'stack'
  time: string
}

async function getFeedItems(): Promise<FeedItem[]> {
  const supabase = createAdminClient()
  const items: FeedItem[] = []

  const [{ data: recentTools }, { data: recentReviews }, { data: trendingStacks }] = await Promise.all([
    supabase
      .from('tools')
      .select('id, name, slug, tagline, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(5),
    supabase
      .from('reviews')
      .select('id, title, rating, created_at, tool_id')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('collections')
      .select('id, name, share_slug, view_count, icon')
      .eq('is_public', true)
      .order('view_count', { ascending: false })
      .limit(4),
  ])

  for (const tool of recentTools ?? []) {
    items.push({
      id: `tool-${tool.id}`,
      type: 'new_tool',
      title: tool.name,
      subtitle: 'New tool added',
      href: `/tools/${tool.slug}`,
      icon: 'tool',
      time: tool.published_at ?? new Date().toISOString(),
    })
  }

  // Fetch tool info for reviews
  const reviewToolIds = (recentReviews ?? []).map(r => r.tool_id).filter(Boolean) as string[]
  const { data: reviewTools } = reviewToolIds.length > 0
    ? await supabase.from('tools').select('id, name, slug').in('id', reviewToolIds)
    : { data: [] as { id: string; name: string; slug: string }[] }
  const toolMap = new Map((reviewTools ?? []).map((t) => [t.id, t]))

  for (const review of recentReviews ?? []) {
    const tool = toolMap.get(review.tool_id)
    if (!tool?.slug) continue
    items.push({
      id: `review-${review.id}`,
      type: 'new_review',
      title: `${review.rating}★ review of ${tool.name}`,
      subtitle: review.title || 'New review posted',
      href: `/tools/${tool.slug}`,
      icon: 'review',
      time: review.created_at,
    })
  }

  for (const stack of trendingStacks ?? []) {
    items.push({
      id: `stack-${stack.id}`,
      type: 'trending_stack',
      title: stack.name,
      subtitle: `${stack.view_count ?? 0} views`,
      href: `/stacks/${stack.share_slug}`,
      icon: 'stack',
      time: new Date().toISOString(),
    })
  }

  items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  return items.slice(0, 12)
}

export async function DiscoverFeed() {
  const items = await getFeedItems()
  if (items.length === 0) return null

  return (
    <section className="w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center mb-5">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2.5">
            <span className="text-primary font-bold">&#x27E9;</span> Live Activity
          </h2>
        </div>
      </div>
      <DiscoverCarousel items={items} />
    </section>
  )
}
