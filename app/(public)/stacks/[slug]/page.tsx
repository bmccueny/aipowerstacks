import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { SITE_URL } from '@/lib/constants/site'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShareButton } from '@/components/stacks/ShareButton'
import { SaveStackButton } from '@/components/stacks/SaveStackButton'
import { UnsaveStackButton } from '@/components/stacks/UnsaveStackButton'
import { EmbedButton } from '@/components/stacks/EmbedButton'
import { FollowButton } from '@/components/stacks/FollowButton'
import { EditStackPanel } from '@/components/stacks/EditStackPanel'
import { SortableToolList } from '@/components/stacks/SortableToolList'
import { StackViewIncrement } from '@/components/stacks/StackViewIncrement'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Globe, Lock, ArrowLeft, ExternalLink,
  ShieldCheck, Zap, CalendarDays, Bookmark, Eye, ArrowLeftRight,
  Star, MessageSquareQuote,
} from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: collection } = await supabase
    .from('collections')
    .select('name, description')
    .eq('share_slug', slug)
    .single()

  if (!collection) return { title: 'Stack Not Found' }

  const title = `${collection.name} | AI Power Stack`
  const description = collection.description || `A curated AI Power Stack on AIPowerStacks.`

  return {
    title,
    description,
    alternates: { canonical: `/stacks/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/stacks/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: collectionRaw, error } = await supabase
    .from('collections')
    .select(`
      *,
      profiles:user_id (display_name, avatar_url, username),
      source:source_collection_id (
        id, name, share_slug,
        profiles:user_id (username, display_name)
      )
    `)
    .eq('share_slug', slug)
    .single()

  if (error || !collectionRaw) notFound()
  const collection = collectionRaw as any

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    // Corrupted auth cookie
  }
  const isOwner = user?.id === collection.user_id

  if (!collection.is_public && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4">
        <div className="glass-card rounded-md p-12 text-center max-w-md">
          <Lock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">This Stack is Private</h1>
          <p className="text-muted-foreground mb-6">The owner hasn&apos;t made this stack public yet.</p>
          <Link href="/tools"><Button>Browse Public Tools</Button></Link>
        </div>
      </div>
    )
  }

  const { data: items } = await supabase
    .from('collection_items')
    .select(`
      sort_order, note,
      tools:tool_id (
        id, name, slug, tagline, description, website_url, logo_url,
        pricing_model, avg_rating, review_count, upvote_count,
        is_verified, has_api, is_open_source, use_cases,
        categories:category_id (name, slug, icon, color)
      )
    `)
    .eq('collection_id', collection.id)
    .order('sort_order', { ascending: true })

  const tools = (items?.map(i => ({ ...(i.tools as any), _note: i.note })) ?? []).filter(t => t?.id) as any[]

  const pricingCounts = tools.reduce((acc: Record<string, number>, t) => {
    acc[t.pricing_model] = (acc[t.pricing_model] ?? 0) + 1
    return acc
  }, {})

  const categories = [...new Map(
    tools.map(t => t.categories).filter(Boolean).map((c: any) => [c.slug, c])
  ).values()] as any[]

  const shareUrl = `${SITE_URL}/stacks/${slug}`
  const creator = (collection as any).profiles
  const isSavedStack = !!collection.source_collection_id
  const sourceCollection = (collection as any).source

  let isFollowingCreator = false
  if (user && !isOwner) {
    const { data: followRow } = await supabase
      .from('profile_follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', collection.user_id)
      .maybeSingle()
    isFollowingCreator = !!followRow
  }

  // Check if current user has saved this collection
  let hasSavedThis = false
  if (user && !isOwner) {
    const { data: saveRow } = await supabase
      .from('collection_saves')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('collection_id', collection.id)
      .maybeSingle()
    hasSavedThis = !!saveRow
  }

  return (
    <div className="pb-24">
      {collection.is_public && !isOwner && <StackViewIncrement collectionId={collection.id} />}

      {/* Hero — identity only */}
      <div className="relative overflow-hidden border-b border-foreground/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-10">
          <Link
            href={isOwner ? '/dashboard' : '/stacks'}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {isOwner ? 'Back to Dashboard' : 'Discover Power Stacks'}
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-md bg-primary/15 border border-primary/20 shrink-0 flex items-center justify-center text-3xl sm:text-4xl">
              {collection.icon || '⚡'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                  {collection.name}
                </h1>
                {collection.is_public ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <Globe className="h-3 w-3" /> Public
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-full">
                    <Lock className="h-3 w-3" /> Private
                  </span>
                )}
              </div>
              {collection.description && (
                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                  {collection.description}
                </p>
              )}
              {isSavedStack && sourceCollection && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                  <span>Remixed from</span>
                  <Link 
                    href={`/stacks/${sourceCollection.share_slug}`}
                    className="font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    {sourceCollection.name}
                  </Link>
                  <span>by</span>
                  <Link 
                    href={`/curators/${sourceCollection.profiles?.username}`}
                    className="font-bold text-foreground hover:text-primary transition-colors"
                  >
                    @{sourceCollection.profiles?.username}
                  </Link>
                </div>
              )}
              {categories.length > 0 && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {categories.map((cat: any) => (
                    <Link
                      key={cat.slug}
                      href={`/categories/${cat.slug}`}
                      className="text-xs font-medium text-muted-foreground bg-muted/60 border border-foreground/10 px-2.5 py-1 rounded-full hover:border-primary/30 hover:text-primary transition-colors"
                    >
                      {cat.icon} {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body: tools + sidebar */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Tools list */}
          <div className="flex-1 min-w-0">
            {tools.length === 0 ? (
              <div className="glass-card rounded-md p-16 text-center border-dashed">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <h2 className="text-lg font-bold text-muted-foreground mb-2">This stack is empty</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {isOwner && !isSavedStack ? 'Browse tools and click "Add to Stack" to save them here.' : 'No tools have been added yet.'}
                </p>
                {isOwner && !isSavedStack && <Link href="/tools"><Button>Browse Tools</Button></Link>}
              </div>
            ) : (isOwner && !isSavedStack) ? (
              <SortableToolList tools={tools} collectionId={collection.id} />
            ) : (
              <div className="space-y-2.5">
                {tools.map((tool, i) => {
                  const pricingColor = PRICING_BADGE_COLORS[tool.pricing_model] ?? PRICING_BADGE_COLORS.unknown
                  const pricingLabel = PRICING_LABELS[tool.pricing_model] ?? 'Unknown'
                  return (
                    <div key={tool.id} className="rounded-xl overflow-hidden group bg-card shadow-sm">
                      <div className="flex items-start gap-4 p-4 sm:p-5">
                        {/* Number */}
                        <span className="text-xs font-black text-muted-foreground/25 w-5 shrink-0 text-right tabular-nums select-none pt-1">
                          {i + 1}
                        </span>

                        {/* Logo */}
                        <div className="h-12 w-12 shrink-0 rounded-xl bg-muted overflow-hidden flex items-center justify-center shadow-sm">
                          {tool.logo_url ? (
                            <Image src={tool.logo_url} alt={tool.name} width={48} height={48} className="object-contain" />
                          ) : (
                            <span className="font-black text-primary text-xl">{tool.name[0]}</span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                  href={`/tools/${tool.slug}`}
                                  className="font-bold text-base leading-tight hover:text-primary transition-colors"
                                >
                                  {tool.name}
                                </Link>
                                {tool.is_verified && (
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-muted-foreground text-sm mt-0.5 leading-relaxed line-clamp-2">
                                {tool.tagline}
                              </p>
                            </div>
                            <a
                              href={tool.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/15 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                            >
                              Visit <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>

                          {/* Meta row */}
                          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                            <Badge variant="outline" className={`text-[10px] ${pricingColor}`}>
                              {pricingLabel}
                            </Badge>
                            {tool.categories && (
                              <Link
                                href={`/categories/${tool.categories.slug}`}
                                className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
                              >
                                {tool.categories.icon} {tool.categories.name}
                              </Link>
                            )}
                            {tool.avg_rating > 0 && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {tool.avg_rating.toFixed(1)}
                              </span>
                            )}
                          </div>

                          {/* Curator note */}
                          {tool._note && (
                            <div className="mt-3 flex items-start gap-2 bg-muted/60 border border-foreground/10 rounded-lg px-3 py-2.5">
                              <MessageSquareQuote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                              <p className="text-sm text-foreground/75 italic leading-relaxed">{tool._note}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-64 xl:w-72 shrink-0 space-y-4 lg:sticky lg:top-6">

            {/* Creator */}
            {creator && (
              <div className="glass-card rounded-xl p-5">
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-3">
                  Curator
                </p>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-11 w-11 border-2 border-primary/20">
                    <AvatarImage src={creator.avatar_url ?? undefined} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-black">
                      {(creator.display_name || creator.username || 'A')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    {creator.username ? (
                      <Link
                        href={`/curators/${creator.username}`}
                        className="font-bold text-sm hover:text-primary transition-colors block truncate"
                      >
                        @{creator.username}
                      </Link>
                    ) : (
                      <span className="font-bold text-sm block truncate">
                        {creator.display_name || 'Anonymous'}
                      </span>
                    )}
                  </div>
                </div>
                {!isOwner && user && creator.username && (
                  <FollowButton
                    followingId={collection.user_id}
                    initialIsFollowing={isFollowingCreator}
                    className="w-full"
                  />
                )}
              </div>
            )}

            {/* Actions */}
            <div className="glass-card rounded-xl p-5 space-y-2">
              {isOwner && !isSavedStack ? (
                <>
                  <Link href="/tools" className="block">
                    <Button variant="outline" className="w-full gap-2 h-10">
                      <Zap className="h-4 w-4" /> Add Tools
                    </Button>
                  </Link>
                  <EditStackPanel
                    collectionId={collection.id}
                    initialName={collection.name}
                    initialDescription={collection.description}
                    initialIsPublic={collection.is_public}
                    initialIcon={collection.icon ?? '⚡'}
                  />
                </>
              ) : (
                <div className="space-y-2">
                  <SaveStackButton
                    sourceCollectionId={collection.id}
                    stackName={collection.name}
                    toolIds={tools.map(t => t.id)}
                    className="w-full"
                  />
                  {/* If user is viewing someone else's stack they've already saved */}
                  {!isOwner && hasSavedThis && (
                    <UnsaveStackButton
                      collectionId={collection.id}
                      stackName={collection.name}
                      className="w-full"
                    />
                  )}
                </div>
              )}
              {collection.is_public && (
                <>
                  <ShareButton url={shareUrl} stackName={collection.name} className="w-full" />
                  <EmbedButton slug={slug} className="w-full" />
                  <Link href={`/stacks/compare?a=${slug}`} className="block">
                    <Button variant="outline" className="w-full gap-2">
                      <ArrowLeftRight className="h-4 w-4" /> Compare Stacks
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="glass-card rounded-xl p-5">
              <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-4">
                Stats
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5" /> Views
                  </span>
                  <span className="font-bold">{(collection as any).view_count || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Bookmark className="h-3.5 w-3.5" /> Saves
                  </span>
                  <span className="font-bold">{(collection as any).save_count || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <ArrowLeftRight className="h-3.5 w-3.5" /> Remixes
                  </span>
                  <span className="font-bold">{(collection as any).save_count || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" /> Created
                  </span>
                  <span className="font-medium text-xs">
                    {new Date(collection.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Pricing breakdown */}
            {Object.keys(pricingCounts).length > 0 && (
              <div className="glass-card rounded-xl p-5">
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-3">
                  Pricing Mix
                </p>
                <div className="space-y-2">
                  {Object.entries(pricingCounts).map(([model, count]) => (
                    <div key={model} className="flex items-center justify-between">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${PRICING_BADGE_COLORS[model] ?? ''}`}>
                        {PRICING_LABELS[model] ?? model}
                      </span>
                      <span className="text-sm font-bold tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
