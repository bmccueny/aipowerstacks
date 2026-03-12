import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { SocialPostActions } from '@/components/admin/SocialPostActions'
import { ExternalLink, MessageSquare } from 'lucide-react'

export const metadata: Metadata = { title: 'Social Posts Queue' }

type StatusFilter = 'all' | 'draft' | 'approved' | 'posted' | 'skipped'

export default async function AdminSocialPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusParam } = await searchParams
  const status: StatusFilter =
    statusParam === 'draft' || statusParam === 'approved' || statusParam === 'posted' || statusParam === 'skipped'
      ? statusParam
      : 'all'

  const supabase = createAdminClient()

  let query = supabase
    .from('social_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: posts } = await query

  const allPosts = (posts ?? []) as {
    id: string
    platform: string
    post_type: string
    content: string
    hashtags: string[] | null
    link_url: string | null
    link_title: string | null
    source_type: string | null
    source_id: string | null
    status: string
    scheduled_for: string | null
    posted_at: string | null
    notes: string | null
    created_at: string
    updated_at: string
  }[]

  const statusBadgeClass: Record<string, string> = {
    draft: 'border-amber-500/30 text-amber-400',
    approved: 'border-emerald-500/30 text-emerald-400',
    posted: 'border-blue-500/30 text-blue-400',
    skipped: 'border-white/20 text-muted-foreground',
  }

  const postTypeBadgeClass: Record<string, string> = {
    tool_highlight: 'border-purple-500/30 text-purple-400',
    blog_promo: 'border-sky-500/30 text-sky-400',
    stat_insight: 'border-emerald-500/30 text-emerald-400',
    tip: 'border-amber-500/30 text-amber-400',
    engagement: 'border-pink-500/30 text-pink-400',
  }

  const statusCounts = allPosts.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const buildHref = (s: StatusFilter) => (s === 'all' ? '/admin/social' : `/admin/social?status=${s}`)

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold flex items-center gap-3">
            <MessageSquare className="h-7 w-7" /> Social Posts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-generated tweet drafts. Review, edit, copy, and post manually.
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { key: 'all' as StatusFilter, label: 'All' },
          { key: 'draft' as StatusFilter, label: `Drafts${statusCounts.draft ? ` (${statusCounts.draft})` : ''}` },
          { key: 'approved' as StatusFilter, label: `Approved${statusCounts.approved ? ` (${statusCounts.approved})` : ''}` },
          { key: 'posted' as StatusFilter, label: `Posted${statusCounts.posted ? ` (${statusCounts.posted})` : ''}` },
          { key: 'skipped' as StatusFilter, label: 'Skipped' },
        ]).map((item) => (
          <Link
            key={item.key}
            href={buildHref(item.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              status === item.key
                ? 'bg-primary text-white'
                : 'bg-transparent border border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {allPosts.length === 0 ? (
        <div className="bg-card/50 border border-border/50 rounded-lg p-12 text-center text-muted-foreground">
          <p>No social posts found. The cron job generates 2 tweet drafts daily at 12:00 UTC.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allPosts.map((post) => (
            <div key={post.id} className="bg-card/50 border border-border/50 rounded-lg p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-xs ${statusBadgeClass[post.status] ?? ''}`}>
                    {post.status}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${postTypeBadgeClass[post.post_type] ?? 'border-border/50'}`}>
                    {post.post_type.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString()} {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {post.link_url && (
                  <a
                    href={post.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                  >
                    {post.link_title ?? 'Link'} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <p className="text-sm mt-3 whitespace-pre-wrap leading-relaxed">{post.content}</p>

              {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {post.hashtags.map((tag) => (
                    <span key={tag} className="text-xs text-primary/70">{tag}</span>
                  ))}
                </div>
              )}

              {post.posted_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Posted: {new Date(post.posted_at).toLocaleDateString()} {new Date(post.posted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}

              <SocialPostActions
                post={{
                  id: post.id,
                  content: post.content,
                  status: post.status,
                  link_url: post.link_url,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
