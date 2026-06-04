import type { Metadata } from 'next'
import Link from 'next/link'
import { Trophy, Star, Layers, Users } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { Profile } from '@/lib/types'

export const metadata: Metadata = {
  title: 'AI Tool Curators | Top Reviewers & Stack Builders',
  description: 'Meet the top AI tool curators on AIPowerStacks. See their stacks, reviews, and recommendations.',
  alternates: { canonical: '/curators' },
  openGraph: {
    title: 'AI Tool Curators | Top Reviewers & Stack Builders',
    description: 'Meet the top AI tool curators on AIPowerStacks. See their stacks, reviews, and recommendations.',
    type: 'website',
    siteName: 'AIPowerStacks',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@aipowerstacks',
    title: 'AI Tool Curators | Top Reviewers & Stack Builders',
    description: 'Meet the top AI tool curators on AIPowerStacks. See their stacks, reviews, and recommendations.',
  },
}

export const revalidate = 300

/** Extended profile with columns not yet in generated types */
type CuratorRow = Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'bio'> & {
  reputation_score: number | null
  curator_tier: string | null
}

type CuratorWithCounts = CuratorRow & {
  stack_count: number
  review_count: number
}

const TIER_META: Record<string, { label: string; color: string }> = {
  'Top Curator':      { label: 'Top Curator',      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  'Pro Curator':      { label: 'Pro Curator',       color: 'text-primary bg-primary/10 border-primary/20' },
  'Emerging Curator': { label: 'Emerging Curator',  color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' },
}

function tierFromScore(score: number): string {
  if (score >= 1000) return 'Top Curator'
  if (score >= 500)  return 'Pro Curator'
  if (score >= 100)  return 'Emerging Curator'
  return ''
}

export default async function CuratorsPage() {
  const supabase = createAdminClient()

  const [curatorsRes, stackCountsRes, reviewCountsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio, reputation_score, curator_tier')
      .not('username', 'is', null)
      .gt('reputation_score', 0)
      .order('reputation_score', { ascending: false })
      .limit(50),

    // Count public stacks per user — grouped via a select with count
    supabase
      .from('collections')
      .select('user_id')
      .eq('is_public', true),

    // Count published reviews per user
    supabase
      .from('reviews')
      .select('user_id')
      .eq('status', 'published'),
  ])

  const rawCurators = (curatorsRes.data ?? []) as unknown as CuratorRow[]

  // Build count maps from the flat rows
  const stackMap = new Map<string, number>()
  for (const row of curatorsRes.data ? (stackCountsRes.data ?? []) : []) {
    const uid = (row as { user_id: string }).user_id
    stackMap.set(uid, (stackMap.get(uid) ?? 0) + 1)
  }

  const reviewMap = new Map<string, number>()
  for (const row of curatorsRes.data ? (reviewCountsRes.data ?? []) : []) {
    const uid = (row as { user_id: string }).user_id
    reviewMap.set(uid, (reviewMap.get(uid) ?? 0) + 1)
  }

  const curators: CuratorWithCounts[] = rawCurators.map((c) => ({
    ...c,
    stack_count:  stackMap.get(c.id)  ?? 0,
    review_count: reviewMap.get(c.id) ?? 0,
  }))

  return (
    <div className="page-shell">
      {/* Hero */}
      <div className="page-hero text-center">
        <div className="inline-flex items-center gap-2 gum-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
          <Users className="h-3.5 w-3.5" />
          Community
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">AI Tool Curators</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          The people building the best AI tool stacks and writing the most helpful reviews. Follow them to stay sharp.
        </p>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
          <span><strong className="text-foreground">{curators.length}</strong> top curators</span>
          <span className="text-foreground/20">·</span>
          <span className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5" /> Ranked by reputation
          </span>
        </div>
      </div>

      {/* Grid */}
      {curators.length === 0 ? (
        <div className="glass-card rounded-md p-16 text-center border-dashed">
          <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">No curators found yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {curators.map((curator, i) => {
            const repScore  = curator.reputation_score ?? 0
            const tierLabel = curator.curator_tier || tierFromScore(repScore)
            const tierMeta  = TIER_META[tierLabel]
            const initials  = (curator.display_name || curator.username || 'A')[0].toUpperCase()

            return (
              <Link
                key={curator.id}
                href={`/curators/${curator.username}`}
                className="glass-card rounded-md overflow-hidden flex flex-col group relative hover:border-primary/20 transition-all hover:translate-y-[-1px]"
              >
                {/* Top accent */}
                <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

                <div className="p-5 flex flex-col gap-4 flex-1">
                  {/* Rank + avatar + name */}
                  <div className="flex items-start gap-4">
                    <span className="text-lg font-black tabular-nums text-muted-foreground/30 w-6 text-right shrink-0 pt-1">
                      {i + 1}
                    </span>

                    <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-sm shrink-0">
                      <AvatarImage src={curator.avatar_url ?? undefined} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-black">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base leading-tight group-hover:text-primary transition-colors truncate">
                        {curator.display_name || `@${curator.username}`}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5 truncate">
                        @{curator.username}
                      </p>
                      {tierMeta && (
                        <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded border ${tierMeta.color}`}>
                          <Trophy className="h-2.5 w-2.5" />
                          {tierMeta.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {curator.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pl-10">
                      {curator.bio}
                    </p>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-4 pt-3 border-t border-border mt-auto">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Star className="h-3 w-3 text-primary" />
                      <span className="font-black text-foreground">{repScore.toLocaleString()}</span>
                      <span className="text-muted-foreground">rep</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Layers className="h-3 w-3 text-primary" />
                      <span className="font-black text-foreground">{curator.stack_count}</span>
                      <span className="text-muted-foreground">stack{curator.stack_count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="font-black text-foreground">{curator.review_count}</span>
                      <span className="text-muted-foreground">review{curator.review_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 glass-card rounded-md p-8 text-center border-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
        <Trophy className="h-8 w-8 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold mb-2">Become a Top Curator</h2>
        <p className="text-muted-foreground text-sm mb-5 max-w-sm mx-auto">
          Build stacks, write reviews, and earn reputation to climb the leaderboard.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-md hover:bg-primary/90 transition-colors"
        >
          <Layers className="h-4 w-4" /> Start curating
        </Link>
      </div>
    </div>
  )
}
