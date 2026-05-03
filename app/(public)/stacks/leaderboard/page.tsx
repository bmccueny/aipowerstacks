import Link from 'next/link'
import type { Metadata } from 'next'
import { Trophy, TrendingUp, Eye, Bookmark } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'Stack Leaderboard | Most Efficient AI Tool Stacks',
  description: 'See the most popular and efficient AI tool stacks built by the community. Find inspiration for your own stack.',
}

export const revalidate = 300 // 5 min cache

type StackEntry = {
  id: string
  name: string
  share_slug: string
  save_count: number
  view_count: number
  created_at: string
  profiles: { username: string | null; display_name: string | null; avatar_url: string | null } | null
  collection_items: { tools: { name: string; slug: string; logo_url: string | null } }[]
}

export default async function LeaderboardPage() {
  const supabase = createAdminClient()

  const [topSaved, trending] = await Promise.all([
    supabase
      .from('collections')
      .select('id, name, share_slug, save_count, view_count, created_at, profiles:user_id(username, display_name, avatar_url), collection_items(tools:tool_id(name, slug, logo_url))')
      .eq('is_public', true)
      .order('save_count', { ascending: false })
      .limit(20),
    supabase
      .from('collections')
      .select('id, name, share_slug, save_count, view_count, created_at, profiles:user_id(username, display_name, avatar_url), collection_items(tools:tool_id(name, slug, logo_url))')
      .eq('is_public', true)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('view_count', { ascending: false })
      .limit(10),
  ])

  const topStacks = (topSaved.data ?? []) as unknown as StackEntry[]
  const trendingStacks = (trending.data ?? []) as unknown as StackEntry[]

  return (
    <main className="min-h-[100dvh] pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3 flex items-center gap-2">
            <span className="w-5 h-px bg-primary/60" /> Community
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em]">Stack Leaderboard</h1>
          <p className="mt-3 text-base text-muted-foreground max-w-md">
            The most popular AI tool stacks built by the community. Get inspired, save what works.
          </p>
        </div>

        {/* Trending this month */}
        {trendingStacks.length > 0 && (
          <section className="mb-14">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-5 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" /> Trending this month
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trendingStacks.map(stack => (
                <StackCard key={stack.id} stack={stack} />
              ))}
            </div>
          </section>
        )}

        {/* All-time top */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-5 flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-primary" /> Most saved all-time
          </h2>
          <div className="space-y-2">
            {topStacks.map((stack, i) => (
              <Link
                key={stack.id}
                href={`/stacks/${stack.share_slug}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-foreground/[0.06] hover:border-primary/20 hover:translate-y-[-1px] transition-all group"
              >
                <span className="text-lg font-black tabular-nums text-muted-foreground/50 w-6 text-right shrink-0">
                  {i + 1}
                </span>
                <div className="flex -space-x-2 shrink-0">
                  {stack.collection_items.slice(0, 4).map((item, j) => (
                    <div key={j} className="w-7 h-7 rounded-md border-2 border-background bg-white flex items-center justify-center overflow-hidden">
                      {item.tools?.logo_url ? (
                        <img src={item.tools.logo_url} alt="" className="w-5 h-5 object-contain" />
                      ) : (
                        <span className="text-[8px] font-bold text-primary">{item.tools?.name?.[0]}</span>
                      )}
                    </div>
                  ))}
                  {stack.collection_items.length > 4 && (
                    <span className="w-7 h-7 rounded-md border-2 border-background bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                      +{stack.collection_items.length - 4}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">{stack.name}</p>
                  <p className="text-xs text-muted-foreground">
                    by {stack.profiles?.display_name ?? stack.profiles?.username ?? 'Anonymous'}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" /> {stack.save_count}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {stack.view_count}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-12 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06] p-8 text-center">
          <p className="font-bold text-lg mb-2">Build your own stack</p>
          <p className="text-sm text-muted-foreground mb-5">Share your AI tool setup and see how it compares.</p>
          <Link href="/tracker" className="inline-flex items-center gap-2 h-10 px-6 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
            Start tracking
          </Link>
        </div>
      </div>
    </main>
  )
}

function StackCard({ stack }: { stack: StackEntry }) {
  return (
    <Link
      href={`/stacks/${stack.share_slug}`}
      className="rounded-xl border border-foreground/[0.06] p-4 hover:border-primary/20 transition-all group"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex -space-x-1.5">
          {stack.collection_items.slice(0, 3).map((item, j) => (
            <div key={j} className="w-6 h-6 rounded-md border border-background bg-white flex items-center justify-center overflow-hidden">
              {item.tools?.logo_url ? (
                <img src={item.tools.logo_url} alt="" className="w-4 h-4 object-contain" />
              ) : (
                <span className="text-[7px] font-bold text-primary">{item.tools?.name?.[0]}</span>
              )}
            </div>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">{stack.collection_items.length} tools</span>
      </div>
      <p className="font-bold text-sm group-hover:text-primary transition-colors truncate">{stack.name}</p>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
        <span>{stack.profiles?.display_name ?? 'Anonymous'}</span>
        <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" /> {stack.view_count}</span>
        <span className="flex items-center gap-0.5"><Bookmark className="h-2.5 w-2.5" /> {stack.save_count}</span>
      </div>
    </Link>
  )
}
