import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants/site'
import { createClient } from '@/lib/supabase/server'
import { SaveStackButton } from '@/components/stacks/SaveStackButton'
import { FollowButton } from '@/components/stacks/FollowButton'
import { Layers, Eye, Bookmark, Users, Star, ShieldCheck, Trophy, Zap, Award, Twitter, Linkedin, Github, Youtube, Instagram, Globe, MessageSquareQuote } from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

const SOCIAL_PLATFORMS: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  twitter:   { label: 'Twitter / X', icon: Twitter,   color: 'hover:text-[#1da1f2]' },
  linkedin:  { label: 'LinkedIn',    icon: Linkedin,  color: 'hover:text-[#0077b5]' },
  github:    { label: 'GitHub',      icon: Github,    color: 'hover:text-foreground' },
  youtube:   { label: 'YouTube',     icon: Youtube,   color: 'hover:text-[#ff0000]' },
  instagram: { label: 'Instagram',   icon: Instagram, color: 'hover:text-[#e1306c]' },
  website:   { label: 'Website',     icon: Globe,     color: 'hover:text-primary' },
}
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DirectMessageDialog } from '@/components/curators/DirectMessageDialog'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('display_name, bio, avatar_url')
    .eq('username', username)
    .single()

  const displayName = profile?.display_name || `@${username}`
  const title = `${displayName} (@${username}) - AI Tool Curator`
  const description = profile?.bio
    ? `${profile.bio.slice(0, 120)}${profile.bio.length > 120 ? '...' : ''} Browse Power Stacks curated by ${displayName}.`
    : `Browse AI Power Stacks and tool reviews curated by ${displayName} on AIPowerStacks.`

  return {
    title,
    description,
    alternates: { canonical: `/curators/${username}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/curators/${username}`,
      type: 'profile',
      siteName: 'AIPowerStacks',
      ...(profile?.avatar_url ? { images: [{ url: profile.avatar_url, width: 200, height: 200, alt: displayName }] } : { images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'AIPowerStacks' }] }),
    },
    twitter: {
      card: 'summary',
      site: '@aipowerstacks',
      title,
      description,
      ...(profile?.avatar_url ? { images: [profile.avatar_url] } : {}),
    },
  }
}

export default async function CuratorPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, created_at, role, reputation_score, curator_tier, social_links')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === profile.id

  const [stacksRes, followerRes, followingRes, isFollowingRes, followerListRes, followingListRes, reviewsRes] = await Promise.all([
    supabase
      .from('collections')
      .select(`
        id, name, description, share_slug, icon, view_count, save_count,
        collection_items(tools:tool_id(id, name, logo_url))
      `)
      .eq('user_id', profile.id)
      .eq('is_public', true)
      .order('view_count', { ascending: false }),
    supabase
      .from('profile_follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('following_id', profile.id),
    supabase
      .from('profile_follows')
      .select('following_id', { count: 'exact', head: true })
      .eq('follower_id', profile.id),
    user && !isOwner
      ? supabase
          .from('profile_follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    isOwner
      ? supabase
          .from('profile_follows')
          .select('profiles:follower_id(id, username, display_name, avatar_url)')
          .eq('following_id', profile.id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    isOwner
      ? supabase
          .from('profile_follows')
          .select('profiles:following_id(id, username, display_name, avatar_url)')
          .eq('follower_id', profile.id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from('reviews')
      .select(`
        id, rating, title, body, created_at, helpful_count, is_verified,
        tools:tool_id(id, name, slug, logo_url)
      `)
      .eq('user_id', profile.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
  ])

  const stacks = (stacksRes.data ?? []) as any[]
  const followerCount = followerRes.count ?? 0
  const followingCount = followingRes.count ?? 0
  const isFollowing = !!(isFollowingRes as any).data
  const followerList = ((followerListRes.data ?? []) as any[]).map((r) => r.profiles).filter(Boolean)
  const followingList = ((followingListRes.data ?? []) as any[]).map((r) => r.profiles).filter(Boolean)
  
  const reviews = (reviewsRes.data ?? []) as any[]
  const reviewsCount = reviews.length
  const totalHelpfulClicks = reviews.reduce((acc, r) => acc + (r.helpful_count || 0), 0)

  // Calculate membership duration
  const joinedDate = new Date(profile.created_at)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - joinedDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  const repScore = profile.reputation_score ?? 0
  const tierThresholds = [
    { label: 'Emerging Curator', min: 100, max: 499 },
    { label: 'Pro Curator', min: 500, max: 999 },
    { label: 'Top Curator', min: 1000, max: null },
  ]
  const nextTier = tierThresholds.find((t) => repScore < t.min)
  const prevMin = nextTier
    ? (tierThresholds[tierThresholds.indexOf(nextTier) - 1]?.min ?? 0)
    : null
  const tierProgress = nextTier && prevMin !== null
    ? Math.round(((repScore - prevMin) / (nextTier.min - prevMin)) * 100)
    : 100

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Column */}
      <div className="lg:col-span-8 space-y-12">
        {/* Profile header */}
        <div className="glass-card rounded-md p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="shrink-0">
              <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-md">
                <AvatarImage src={profile.avatar_url} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-black">
                  {(profile.display_name || profile.username || 'A')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-black tracking-tight">
                      {profile.display_name || `@${profile.username}`}
                    </h1>
                  </div>
                  {profile.username && (
                    <p className="text-muted-foreground font-semibold mt-0.5">@{profile.username}</p>
                  )}
                  {profile.bio && (
                    <p className="text-muted-foreground text-sm mt-3 max-w-lg leading-relaxed">{profile.bio}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 mt-5 pt-5 border-t border-foreground/10">
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="font-bold">{stacks.length}</span>
                  <span className="text-muted-foreground">stack{stacks.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-bold">{followerCount}</span>
                  <span className="text-muted-foreground">follower{followerCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold">{followingCount}</span>
                  <span className="text-muted-foreground">following</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stacks grid */}
        <section>
          <h2 className="text-xl font-bold mb-4">Public Stacks</h2>
          {stacks.length === 0 ? (
            <div className="glass-card rounded-md p-12 text-center border-dashed">
              <Layers className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No public stacks yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stacks.map((stack: any) => {
                const tools = (stack.collection_items ?? []).map((i: any) => i.tools).filter(Boolean)
                const toolIds = tools.map((t: any) => t.id)
                const previews = tools.slice(0, 5)
                return (
                  <div
                    key={stack.id}
                    className="glass-card rounded-md overflow-hidden flex flex-col group relative"
                  >
                    <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
                    <div className="p-5 flex flex-col gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <Link href={`/stacks/${stack.share_slug}`} className="block flex-1 min-w-0">
                            <h3 className="font-bold text-lg leading-snug group-hover:text-primary transition-colors line-clamp-1 flex items-center gap-2">
                              <span>{stack.icon || '⚡'}</span>
                              {stack.name}
                            </h3>
                          </Link>
                          <SaveStackButton
                            sourceCollectionId={stack.id}
                            stackName={stack.name}
                            toolIds={toolIds}
                            variant="icon"
                          />
                        </div>
                        {stack.description && (
                          <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed mt-1">
                            {stack.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        {previews.length > 0 && (
                          <Link href={`/stacks/${stack.share_slug}`} className="flex items-center gap-2">
                            <div className="flex items-center">
                              {previews.map((tool: any, i: number) => (
                                <div
                                  key={tool.id}
                                  className="h-7 w-7 rounded-full bg-muted border-2 border-background overflow-hidden flex items-center justify-center shrink-0"
                                  style={{ marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i }}
                                >
                                  {tool.logo_url ? (
                                    <Image src={tool.logo_url} alt={tool.name} width={28} height={28} className="object-contain" />
                                  ) : (
                                    <span className="text-[10px] font-black text-primary">{tool.name[0]}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            <span className="text-[11px] text-muted-foreground font-medium">
                              {tools.length} tool{tools.length !== 1 ? 's' : ''}
                            </span>
                          </Link>
                        )}
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                            <Eye className="h-2.5 w-2.5" /> {stack.view_count || 0}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                            <Bookmark className="h-2.5 w-2.5" /> {stack.save_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Reviews grid */}
        <section>
          <h2 className="text-xl font-bold mb-4">Tool Reviews</h2>
          {reviews.length === 0 ? (
            <div className="glass-card rounded-md p-12 text-center border-dashed">
              <Star className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No tool reviews yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reviews.map((review: any) => (
                <div key={review.id} className="glass-card rounded-xl overflow-hidden flex flex-col group border-b-2 border-b-amber-500/20">
                  <div className="p-6 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`} />
                            ))}
                          </div>
                          {review.is_verified && (
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              <ShieldCheck className="h-2.5 w-2.5" /> Verified
                            </span>
                          )}
                        </div>
                        {review.title && <h3 className="font-bold text-base leading-tight mb-1">{review.title}</h3>}
                        {review.body && <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed italic">"{review.body}"</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-foreground/5 mt-auto">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-muted border border-foreground/10 overflow-hidden flex items-center justify-center shadow-sm shrink-0">
                          {review.tools?.logo_url ? (
                            <Image src={review.tools.logo_url} alt={review.tools.name} width={40} height={40} className="object-contain" />
                          ) : (
                            <span className="font-black text-primary text-base">{review.tools?.name[0]}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-none mb-1">Review for</p>
                          <Link href={`/tools/${review.tools?.slug}`} className="text-sm font-bold text-foreground hover:text-primary transition-colors truncate block">
                            {review.tools?.name}
                          </Link>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {review.helpful_count > 0 && (
                          <span className="text-[10px] text-muted-foreground/60 font-bold flex items-center gap-1">
                            {review.helpful_count} helpful clicks
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Sidebar */}
      <aside className="lg:col-span-4 space-y-6">
        {/* Connect Card */}
        {(!isOwner || (Array.isArray(profile.social_links) && profile.social_links.length > 0)) && (
          <div className="glass-card rounded-md p-6">
            <h3 className="font-bold text-lg mb-4">Connect</h3>
            <div className="space-y-4">
              {!isOwner && (
                <>
                  <FollowButton
                    followingId={profile.id}
                    initialIsFollowing={isFollowing}
                  />
                  <DirectMessageDialog
                    receiverId={profile.id}
                    receiverName={profile.display_name || profile.username}
                    receiverUsername={profile.username}
                    receiverAvatar={profile.avatar_url}
                    currentUserId={user?.id}
                  />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Connect with @{profile.username} to discuss AI tools and Power Stacks.
                  </p>
                </>
              )}
              {Array.isArray(profile.social_links) && profile.social_links.length > 0 && (
                <div className={`flex flex-wrap gap-2${!isOwner ? ' pt-3 border-t border-foreground/10' : ''}`}>
                  {(profile.social_links as { platform: string; url: string }[]).map((link, i) => {
                    const p = SOCIAL_PLATFORMS[link.platform]
                    if (!p || !link.url) return null
                    const Icon = p.icon
                    return (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={p.label}
                        className={`h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground transition-colors ${p.color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Followers / Following — owner only */}
        {isOwner && (followerList.length > 0 || followingList.length > 0) && (
          <div className="glass-card rounded-md p-6">
            <div className="grid grid-cols-2 divide-x divide-foreground/10">
              <div className="pr-4">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
                  Followers <span className="text-foreground">({followerCount})</span>
                </p>
                {followerList.length === 0 ? (
                  <p className="text-xs text-muted-foreground">None yet.</p>
                ) : (
                  <div className="space-y-2">
                    {followerList.slice(0, 5).map((p: any) => (
                      <Link key={p.id} href={`/curators/${p.username}`} className="flex items-center gap-2 group">
                        <Avatar className="h-7 w-7 border border-primary/20 shrink-0">
                          <AvatarImage src={p.avatar_url} className="object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-black">
                            {(p.display_name || p.username || '?')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                          {p.display_name || p.username}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="pl-4">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
                  Following <span className="text-foreground">({followingCount})</span>
                </p>
                {followingList.length === 0 ? (
                  <p className="text-xs text-muted-foreground">None yet.</p>
                ) : (
                  <div className="space-y-2">
                    {followingList.slice(0, 5).map((p: any) => (
                      <Link key={p.id} href={`/curators/${p.username}`} className="flex items-center gap-2 group">
                        <Avatar className="h-7 w-7 border border-primary/20 shrink-0">
                          <AvatarImage src={p.avatar_url} className="object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-black">
                            {(p.display_name || p.username || '?')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                          {p.display_name || p.username}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reputation & Badges Card */}
        <div className="glass-card rounded-md p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" /> Achievements
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              {/* Verified Admin */}
              {profile.role === 'admin' && (
                <div className="badge-flare badge-admin flex items-center gap-3 p-3 rounded-lg overflow-hidden border-2 relative">
                  <div className="sparkle-container">
                    <div className="sparkle" style={{ top: '0%', left: '0%', transform: 'translate(-50%, -50%)', animationDelay: '0s' }} />
                    <div className="sparkle" style={{ top: '0%', right: '0%', transform: 'translate(50%, -50%)', animationDelay: '0.4s' }} />
                    <div className="sparkle" style={{ bottom: '0%', right: '0%', transform: 'translate(50%, 50%)', animationDelay: '0.8s' }} />
                  </div>
                  <div className="h-11 w-11 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_oklch(0.64_0.17_163_/_0.4)] border border-emerald-500/30">
                    <ShieldCheck className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-emerald-600 uppercase tracking-tighter">Verified Admin</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Platform staff member</p>
                  </div>
                </div>
              )}

              {/* Curator Tier */}
              {profile.curator_tier && profile.curator_tier !== 'Standard' && (
                <div className="badge-flare badge-tier-pro flex items-center gap-3 p-3 rounded-lg overflow-hidden">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 shadow-[0_0_10px_oklch(0.79_0.17_355_/_0.3)]">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-primary uppercase tracking-tighter">{profile.curator_tier}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Based on stack engagement</p>
                  </div>
                </div>
              )}

              {/* Trusted Editor */}
              {profile.role === 'editor' && (
                <div className="badge-flare badge-editor flex items-center gap-3 p-3 rounded-lg overflow-hidden">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 shadow-[0_0_10px_oklch(0.58_0.18_247_/_0.3)]">
                    <Zap className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-blue-600 uppercase tracking-tighter">Trusted Editor</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Verifies tool listings</p>
                  </div>
                </div>
              )}

              {/* Prolific Reviewer */}
              {reviewsCount >= 10 && (
                <div className="badge-flare badge-reviewer flex items-center gap-3 p-3 rounded-lg overflow-hidden">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 shadow-[0_0_10px_oklch(0.77_0.15_75_/_0.3)]">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-amber-600 uppercase tracking-tighter">Prolific Reviewer</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{reviewsCount} AI tools reviewed</p>
                  </div>
                </div>
              )}
            </div>

            {/* Reputation + Progress */}
            <div className="pt-4 border-t border-foreground/10 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Reputation Score</span>
                <span className="font-black text-primary">{repScore}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${tierProgress}%` }}
                />
              </div>
              {nextTier ? (
                <p className="text-[10px] text-muted-foreground">
                  {nextTier.min - repScore} pts to <span className="font-semibold text-primary">{nextTier.label}</span>
                </p>
              ) : (
                <p className="text-[10px] text-primary font-semibold">Top Curator — max tier reached</p>
              )}
            </div>

            {/* Stats */}
            <div className="pt-3 border-t border-foreground/10 grid grid-cols-3 text-center">
              <div>
                <p className="text-sm font-black">{reviewsCount}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Reviews</p>
              </div>
              <div className="border-x border-foreground/10">
                <p className="text-sm font-black">{totalHelpfulClicks}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Helpful</p>
              </div>
              <div>
                <p className="text-sm font-black">{diffDays}d</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Member</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
