import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ChallengeSubmitButton } from '@/components/stacks/ChallengeSubmitButton'
import { ChallengeVoteButton } from '@/components/stacks/ChallengeVoteButton'
import { ArrowLeft, Trophy, Clock, Layers } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('stack_challenges').select('title, description').eq('id', id).single()
  const title = data ? `${data.title} | Stack Challenge` : 'Stack Challenge'
  const description = data?.description
    ? `${data.description.slice(0, 150)}${data.description.length > 150 ? '...' : ''}`
    : 'Build the best AI workflow and get voted to the top.'
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'AIPowerStacks',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@aipowerstacks',
      title,
      description,
    },
  }
}

export const revalidate = 30

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: challenge } = await supabase
    .from('stack_challenges')
    .select('*')
    .eq('id', id)
    .single()

  if (!challenge) notFound()

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    // Corrupted auth cookie
  }
  const now = new Date().toISOString()
  const isLive = challenge.is_active && challenge.starts_at <= now && challenge.ends_at >= now

  const { data: submissions } = await supabase
    .from('challenge_submissions')
    .select(`
      id, vote_count, submitted_at,
      collections:collection_id(id, name, icon, share_slug, user_id,
        collection_items(tools:tool_id(id, name, logo_url))
      ),
      profiles:user_id(username, avatar_url, display_name)
    `)
    .eq('challenge_id', id)
    .order('vote_count', { ascending: false })

  const userSubmission = user
    ? (submissions ?? []).find((s: any) => s.profiles && s.collections?.user_id === user.id)
    : null

  const userVotedCollectionId = user
    ? await supabase
        .from('challenge_votes')
        .select('collection_id')
        .eq('challenge_id', id)
        .eq('user_id', user.id)
        .maybeSingle()
        .then((r) => r.data?.collection_id ?? null)
    : null

  let userStacks: any[] = []
  if (user && isLive) {
    const { data } = await supabase
      .from('collections')
      .select('id, name, icon, share_slug')
      .eq('user_id', user.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    userStacks = data ?? []
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pb-24">
      <Link
        href="/stacks/challenges"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Challenges
      </Link>

      {/* Challenge header */}
      <div className="glass-card rounded-md overflow-hidden mb-8">
        <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{challenge.title}</h1>
            {isLive ? (
              <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
                Live
              </span>
            ) : (
              <span className="text-xs font-semibold text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-full shrink-0">
                Ended
              </span>
            )}
          </div>
          {challenge.description && (
            <p className="text-muted-foreground mb-4 leading-relaxed">{challenge.description}</p>
          )}
          <div className="glass-card rounded-lg p-4 border-l-4 border-primary/40 mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1.5">Challenge Prompt</p>
            <p className="font-medium leading-relaxed">{challenge.prompt}</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {isLive ? 'Ends' : 'Ended'}{' '}
              {new Date(challenge.ends_at).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </span>
            <span>{(submissions ?? []).length} submission{(submissions ?? []).length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Submit CTA */}
      {isLive && user && (
        <div className="glass-card rounded-md p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm">
              {userSubmission ? 'You\'ve submitted a stack!' : 'Submit your stack'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {userSubmission
                ? `"${(userSubmission as any).collections?.name}" — ${(userSubmission as any).vote_count} votes`
                : 'Pick one of your public stacks to enter.'}
            </p>
          </div>
          {!userSubmission && (
            <ChallengeSubmitButton challengeId={id} userStacks={userStacks} />
          )}
        </div>
      )}
      {isLive && !user && (
        <div className="glass-card rounded-md p-5 mb-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>{' '}
            to submit your stack or vote.
          </p>
        </div>
      )}

      {/* Submissions leaderboard */}
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        Submissions
      </h2>

      {(submissions ?? []).length === 0 ? (
        <div className="glass-card rounded-md p-12 text-center border-dashed">
          <Layers className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No submissions yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(submissions ?? []).map((sub: any, i: number) => {
            const stack = sub.collections
            const creator = sub.profiles
            const tools = (stack?.collection_items ?? []).map((ci: any) => ci.tools).filter(Boolean).slice(0, 5)
            const hasVoted = userVotedCollectionId === stack?.id

            return (
              <div key={sub.id} className="glass-card rounded-md p-4 flex items-center gap-4">
                <span className="text-sm font-black text-muted-foreground/40 w-5 text-right shrink-0 tabular-nums">
                  {i + 1}
                </span>
                <div className="h-10 w-10 rounded-md bg-primary/15 border border-primary/20 shrink-0 flex items-center justify-center text-xl">
                  {stack?.icon || '⚡'}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/stacks/${stack?.share_slug}`} className="font-bold text-sm hover:text-primary transition-colors">
                    {stack?.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Avatar className="h-4 w-4 border border-primary/10">
                      <AvatarImage src={creator?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[6px] font-black">
                        {(creator?.display_name || creator?.username || '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] text-muted-foreground">
                      {creator?.username ? `@${creator.username}` : creator?.display_name || 'Anonymous'}
                    </span>
                  </div>
                  {tools.length > 0 && (
                    <div className="flex items-center mt-1.5">
                      {tools.map((tool: any, ti: number) => (
                        <div
                          key={tool.id}
                          className="h-5 w-5 rounded-full bg-muted border-[1.5px] border-background overflow-hidden flex items-center justify-center shrink-0"
                          style={{ marginLeft: ti === 0 ? 0 : -6, zIndex: 10 - ti }}
                          title={tool.name}
                        >
                          {tool.logo_url ? (
                            <Image src={tool.logo_url} alt={tool.name} width={20} height={20} className="object-contain" />
                          ) : (
                            <span className="text-[8px] font-black text-primary">{tool.name[0]}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold tabular-nums">{sub.vote_count}</span>
                  {isLive && user && stack?.user_id !== user.id && (
                    <ChallengeVoteButton
                      challengeId={id}
                      collectionId={stack?.id}
                      hasVoted={hasVoted}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
