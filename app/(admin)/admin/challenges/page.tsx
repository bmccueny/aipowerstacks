import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, Trophy } from 'lucide-react'

export const metadata: Metadata = { title: 'Challenges Admin' }

export default async function AdminChallengesPage() {
  const supabase = await createClient()

  const { data: challenges } = await supabase
    .from('stack_challenges')
    .select('id, title, prompt, starts_at, ends_at, is_active, created_at')
    .order('created_at', { ascending: false })

  const now = new Date().toISOString()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="h-7 w-7" /> Stack Challenges
        </h1>
        <Link href="/admin/challenges/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Challenge
          </Button>
        </Link>
      </div>

      {(challenges ?? []).length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center border-dashed">
          <p className="text-muted-foreground">No challenges yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(challenges ?? []).map((c) => {
            const isLive = c.is_active && c.starts_at <= now && c.ends_at >= now
            const ended = c.ends_at < now
            return (
              <div key={c.id} className="glass-card rounded-xl p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{c.title}</h3>
                    {isLive && (
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Live
                      </span>
                    )}
                    {ended && (
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
                        Ended
                      </span>
                    )}
                    {!isLive && !ended && (
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        Upcoming
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{c.prompt}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {new Date(c.starts_at).toLocaleDateString()} → {new Date(c.ends_at).toLocaleDateString()}
                  </p>
                </div>
                <Link href={`/stacks/challenges/${c.id}`}>
                  <Button variant="outline" size="sm">View</Button>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
