import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Trophy, Clock, Layers } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Stack Challenges | AIPowerStacks',
  description: 'Compete in Stack Challenges — build the best AI workflow for the prompt and get voted to the top.',
}

export const revalidate = 60

export default async function ChallengesPage() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: challenges } = await supabase
    .from('stack_challenges')
    .select('id, title, description, prompt, starts_at, ends_at, is_active')
    .order('created_at', { ascending: false })

  const active = (challenges ?? []).filter(
    (c) => c.is_active && c.starts_at <= now && c.ends_at >= now
  )
  const past = (challenges ?? []).filter(
    (c) => !c.is_active || c.ends_at < now
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pb-24">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-md bg-primary/15 border border-primary/20">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Stack Challenges</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-xl">
          Build the best AI workflow for the prompt. The community votes for their favourite.
        </p>
      </div>

      {/* Active challenge */}
      {active.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs uppercase font-black tracking-widest text-primary mb-4">Live Now</h2>
          <div className="space-y-4">
            {active.map((challenge) => (
              <Link key={challenge.id} href={`/stacks/challenges/${challenge.id}`}>
                <div className="glass-card rounded-md overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-xl mb-1">{challenge.title}</h3>
                        {challenge.description && (
                          <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                            {challenge.description}
                          </p>
                        )}
                        <div className="glass-card rounded-lg p-3 border-l-4 border-primary/40 mb-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Challenge Prompt</p>
                          <p className="text-sm font-medium leading-relaxed">{challenge.prompt}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Ends{' '}
                        {new Date(challenge.ends_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Live
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {active.length === 0 && (
        <div className="glass-card rounded-md p-10 text-center border-dashed mb-10">
          <Trophy className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No active challenge right now. Check back soon.</p>
        </div>
      )}

      {/* Past challenges */}
      {past.length > 0 && (
        <section>
          <h2 className="text-xs uppercase font-black tracking-widest text-muted-foreground mb-4">Past Challenges</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {past.map((challenge) => (
              <Link key={challenge.id} href={`/stacks/challenges/${challenge.id}`}>
                <div className="glass-card rounded-md p-5">
                  <div className="flex items-start gap-3">
                    <Layers className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-1">{challenge.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {challenge.prompt}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-2">
                        Ended {new Date(challenge.ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
