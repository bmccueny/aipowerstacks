import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Bookmark, Layers, Lock, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AvatarUpload } from '@/components/dashboard/AvatarUpload'
import { DirectMessagesInbox } from '@/components/dashboard/DirectMessagesInbox'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'

export const metadata: Metadata = { title: 'My Dashboard' }
export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    // Corrupted auth cookie
  }

  if (!user) redirect('/login')

  const now = new Date().toISOString()
  const [bookmarksRes, reviewsRes, submissionsRes, collectionsRes, savedRes, activeChallengeRes] = await Promise.all([
    supabase
      .from('bookmarks')
      .select(`tool_id, tools (id, name, slug, tagline, logo_url, pricing_model)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('reviews')
      .select(`id, rating, title, created_at, status, tools (id, name, slug)`)
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
      .select(`id, name, icon, is_public, share_slug, view_count, save_count, source_collection_id, collection_items(tools:tool_id(id, name, slug, logo_url))`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('collection_saves')
      .select(`
        collection:collection_id (
          id, name, icon, share_slug, view_count, save_count, user_id,
          profiles:user_id (username, display_name, avatar_url),
          collection_items(tools:tool_id(id, name, slug, logo_url))
        )
      `)
      .eq('user_id', user.id),
    supabase
      .from('stack_challenges')
      .select('id, title, prompt, ends_at')
      .eq('is_active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)
      .limit(1)
      .maybeSingle(),
  ])

  const bookmarks = (bookmarksRes.data ?? []) as unknown as {
    tool_id: string
    tools: { id: string; name: string; slug: string; tagline: string; logo_url: string | null; pricing_model: string }
  }[]
  const reviews = (reviewsRes.data ?? []) as unknown as {
    id: string; rating: number; title: string | null; created_at: string; status: string
    tools: { id: string; name: string; slug: string }
  }[]
  const submissions = (submissionsRes.data ?? []) as { id: string; name: string; status: string; created_at: string }[]
  const allCollections = (collectionsRes.data ?? []) as unknown as {
    id: string; name: string; icon: string | null; is_public: boolean; share_slug: string; view_count: number; save_count: number; source_collection_id: string | null; user_id: string
    collection_items: { tools: { id: string; name: string; slug: string; logo_url: string | null } }[]
  }[]

  const myStacks = allCollections.filter(c => !c.source_collection_id)
  
  // Combine clones (from collections) and links (from collection_saves)
  const linkedStacks = (savedRes.data ?? []).map(r => (r as any).collection).filter(Boolean)
  const clonedStacks = allCollections.filter(c => c.source_collection_id)
  
  // Unify for display
  const savedStacks = [...linkedStacks, ...clonedStacks].map(s => ({
    ...s,
    isLinked: s.user_id !== user.id
  }))
  const activeChallenge = activeChallengeRes.data as { id: string; title: string; prompt: string; ends_at: string } | null

  let userChallengeSubmission: { collection_name: string; vote_count: number } | null = null
  if (activeChallenge) {
    const { data: sub } = await supabase
      .from('challenge_submissions')
      .select('vote_count, collections:collection_id(name)')
      .eq('challenge_id', activeChallenge.id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (sub) {
      userChallengeSubmission = {
        collection_name: (sub as any).collections?.name ?? 'Your stack',
        vote_count: (sub as any).vote_count ?? 0,
      }
    }
  }

  const [profileRes, followerRes, followingRes] = await Promise.all([
    supabase.from('profiles').select('avatar_url, display_name, username, role').eq('id', user.id).maybeSingle(),
    supabase.from('profile_follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', user.id),
    supabase.from('profile_follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', user.id),
  ])
  
  let profile = profileRes.data

  if (!profile) {
    profile = {
      avatar_url: null,
      display_name: user.email?.split('@')[0] || 'User',
      username: null,
      role: 'user'
    }
  }
  const followerCount = followerRes.count ?? 0
  const followingCount = followingRes.count ?? 0
  const isAdmin = profile?.role === 'admin' || profile?.role === 'editor'

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <div>
      <div className="glass-card rounded-xl p-8 mb-10 shadow-sm border-white/10">
        <div className="flex flex-col sm:flex-row items-start gap-8">
          <AvatarUpload
            userId={user.id}
            displayName={profile?.display_name}
            username={profile?.username}
            initialAvatarUrl={profile?.avatar_url}
          />
          <div className="flex-1">
            <h1 className="text-4xl font-black tracking-tight">My Dashboard</h1>
            {profile?.username && (
              <p className="text-muted-foreground font-bold text-lg mt-0.5">@{profile.username}</p>
            )}
            <div className="flex flex-wrap items-center gap-5 mt-6 pt-6 border-t border-foreground/5">
              <div className="text-sm">
                <span className="font-bold text-lg">{followerCount}</span>{' '}
                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">followers</span>
              </div>
              <div className="text-sm border-l border-foreground/10 pl-5">
                <span className="font-bold text-lg">{followingCount}</span>{' '}
                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">following</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 ml-auto">
                {profile?.username && (
                  <Link
                    href={`/curators/${profile.username}`}
                    className="text-xs font-bold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-full transition-all"
                  >
                    View public profile →
                  </Link>
                )}
                <DirectMessagesInbox currentUserId={user.id} />
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" className="rounded-full gap-2 font-bold border-primary/20 hover:border-primary/40 hover:bg-primary/5 px-4 h-9">
                      <Lock className="h-3.5 w-3.5 text-primary" /> Admin
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main */}
        <div className="lg:col-span-8 space-y-6">
          {activeChallenge && (
            <section className="glass-card rounded-md overflow-hidden relative border-primary/20 bg-primary/5">
              <div className="absolute top-0 left-0 w-1 bg-primary h-full" />
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest">
                    Active Challenge
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-full border border-foreground/5">
                    Ends {new Date(activeChallenge.ends_at).toLocaleDateString()}
                  </div>
                </div>
                <h3 className="text-xl font-black mb-2">{activeChallenge.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">{activeChallenge.prompt}</p>
                {userChallengeSubmission ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-0.5">Your Entry</p>
                      <p className="font-bold text-sm truncate max-w-[200px]">{userChallengeSubmission.collection_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-0.5">Votes</p>
                      <p className="font-black text-lg leading-none">{userChallengeSubmission.vote_count}</p>
                    </div>
                  </div>
                ) : (
                  <Link href="/challenges">
                    <Button size="sm" className="w-full sm:w-auto font-bold gap-2">
                      <Trophy className="h-4 w-4" /> Submit a Stack
                    </Button>
                  </Link>
                )}
              </div>
            </section>
          )}

          <DashboardTabs
            myStacks={myStacks as any}
            savedStacks={savedStacks as any}
            reviews={reviews as any}
            submissions={submissions}
            statusColors={statusColors}
          />
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4">
          <section>
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2 mb-4">
              <Bookmark className="h-5 w-5 text-primary" /> Saved Tools
            </h3>
            <div className="space-y-2">
              {bookmarks.length === 0 ? (
                <div className="glass-card p-6 rounded-md text-center">
                  <p className="text-xs text-muted-foreground">No saved tools yet.</p>
                </div>
              ) : (
                <>
                  {bookmarks.map((b) => (
                    <Link
                      key={b.tool_id}
                      href={`/tools/${b.tools.slug}`}
                      className="glass-card p-3 rounded-md flex items-center gap-3 hover:border-primary/40 transition-colors group"
                    >
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                        {b.tools.logo_url ? (
                          <Image src={b.tools.logo_url} alt={`${b.tools.name} logo`} width={24} height={24} className="object-contain" />
                        ) : (
                          <span className="text-xs font-black text-primary">{b.tools.name[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{b.tools.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{b.tools.tagline}</p>
                      </div>
                    </Link>
                  ))}
                  <Link href="/tools?saved=true" className="block text-center pt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                      View All Saved
                    </span>
                  </Link>
                </>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
