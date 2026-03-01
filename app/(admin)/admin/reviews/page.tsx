import Link from 'next/link'
import type { Metadata } from 'next'
import { ExternalLink } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/reviews/StarRating'
import { ReviewModerationActions } from '@/components/admin/ReviewModerationActions'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export const metadata: Metadata = { title: 'Manage Reviews' }

type ReviewFilter = 'all' | 'simulation' | 'organic'
type ReviewStatus = 'all' | 'draft' | 'pending' | 'published'

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; status?: string }>
}) {
  const { filter: filterParam, status: statusParam } = await searchParams
  const filter: ReviewFilter =
    filterParam === 'simulation' || filterParam === 'organic' ? filterParam : 'all'
  const status: ReviewStatus =
    statusParam === 'draft' || statusParam === 'pending' || statusParam === 'published' ? statusParam : 'all'

  const supabase = createAdminClient()

  let query = supabase
    .from('reviews')
    .select('id, tool_id, user_id, rating, title, body, helpful_count, status, rejection_reason, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(300)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, count } = await query

  const reviewsRaw = (data ?? []) as {
    id: string
    tool_id: string
    user_id: string
    rating: number
    title: string | null
    body: string | null
    helpful_count: number
    status: 'draft' | 'pending' | 'published'
    rejection_reason: string | null
    created_at: string
  }[]

  const toolIds = [...new Set(reviewsRaw.map((r) => r.tool_id))]
  const userIds = [...new Set(reviewsRaw.map((r) => r.user_id))]

  const [toolsRes, profilesRes] = await Promise.all([
    toolIds.length
      ? supabase.from('tools').select('id, name, slug').in('id', toolIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? supabase.from('profiles').select('id, display_name, username, role, avatar_url').in('id', userIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  const toolMap = new Map((toolsRes.data ?? []).map((t) => [t.id, { name: t.name, slug: t.slug }]))
  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, {
    display_name: p.display_name,
    username: p.username,
    role: p.role,
    avatar_url: p.avatar_url,
  }]))

  const isSimulationReview = (review: { title: string | null; body: string | null }) =>
    [review.title ?? '', review.body ?? ''].some((text) =>
      text.toUpperCase().includes('[SIMULATION]')
    )

  const reviews = reviewsRaw
    .map((review) => ({
      ...review,
      tool: toolMap.get(review.tool_id) ?? null,
      profile: profileMap.get(review.user_id) ?? null,
    }))
    .filter((review) => {
      const isSimulation = isSimulationReview(review)
      if (filter === 'simulation') return isSimulation
      if (filter === 'organic') return !isSimulation
      return true
    })

  const statusBadgeClass: Record<'draft' | 'pending' | 'published', string> = {
    draft: 'border-white/20 text-muted-foreground',
    pending: 'border-amber-500/30 text-amber-400',
    published: 'border-emerald-500/30 text-emerald-400',
  }

  const buildHref = (nextFilter: ReviewFilter, nextStatus: ReviewStatus) => {
    const params = new URLSearchParams()
    if (nextFilter !== 'all') params.set('filter', nextFilter)
    if (nextStatus !== 'all') params.set('status', nextStatus)
    return params.size ? `/admin/reviews?${params.toString()}` : '/admin/reviews'
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-3">Reviews ({reviews.length})</h1>
      <p className="text-sm text-muted-foreground mb-6">Total in current status set: {count ?? 0}</p>

      <div className="flex gap-2 mb-3 flex-wrap">
        {([
          { key: 'all', label: 'All' },
          { key: 'simulation', label: 'Simulation Only' },
          { key: 'organic', label: 'Hide Simulation' },
        ] as { key: ReviewFilter; label: string }[]).map((item) => (
          <Link
            key={item.key}
            href={buildHref(item.key, status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === item.key
                ? 'bg-primary text-white'
                : 'glass-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { key: 'all', label: 'All Statuses' },
          { key: 'pending', label: 'Pending' },
          { key: 'published', label: 'Published' },
          { key: 'draft', label: 'Draft' },
        ] as { key: ReviewStatus; label: string }[]).map((item) => (
          <Link
            key={item.key}
            href={buildHref(filter, item.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              status === item.key
                ? 'bg-primary text-white'
                : 'glass-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">No reviews found for this filter.</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="glass-card rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <StarRating rating={review.rating} size="sm" />
                    <Badge variant="outline" className="text-xs">{review.rating}/5</Badge>
                    <Badge variant="outline" className={`text-xs ${statusBadgeClass[review.status]}`}>{review.status}</Badge>
                    {review.profile?.role === 'editor' && (
                      <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">Editor</Badge>
                    )}
                    {isSimulationReview(review) && (
                      <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">Simulation</Badge>
                    )}
                    {review.title && <span className="font-medium text-sm">{review.title}</span>}
                  </div>
                  {review.body && <p className="text-sm text-muted-foreground mb-2">{review.body}</p>}
                  {review.rejection_reason && (
                    <p className="text-xs text-amber-400 mb-2">Rejection note: {review.rejection_reason}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-5 w-5 border border-white/10">
                      <AvatarImage src={review.profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[8px] font-black">
                        {(review.profile?.display_name || review.profile?.username || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-muted-foreground">
                      By {review.profile?.display_name ?? review.profile?.username ?? 'Anonymous'} · {new Date(review.created_at).toLocaleDateString()} · Helpful {review.helpful_count}
                    </p>
                  </div>
                  {review.tool && (
                    <p className="text-xs mt-1 pl-7">
                      <span className="text-muted-foreground">Tool: </span>
                      <Link href={`/tools/${review.tool.slug}`} className="text-primary hover:underline">
                        {review.tool.name}
                      </Link>
                    </p>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <ReviewModerationActions reviewId={review.id} currentStatus={review.status} />
                  {review.tool && (
                    <Link href={`/tools/${review.tool.slug}`} target="_blank">
                      <span className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        Open tool
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
