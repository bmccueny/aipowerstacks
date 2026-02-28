import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShareButton } from '@/components/stacks/ShareButton'
import { SaveStackButton } from '@/components/stacks/SaveStackButton'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'
import {
  Layers, Globe, Lock, ArrowLeft, ExternalLink,
  Star, ShieldCheck, Code2, Zap, CalendarDays, LayoutGrid,
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

  return {
    title: `${collection.name} | AI Power Stack`,
    description: collection.description || `A curated stack of AI tools on AIPowerStacks.`,
  }
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: collection, error } = await supabase
    .from('collections')
    .select(`*, profiles:user_id (display_name, avatar_url, username)`)
    .eq('share_slug', slug)
    .single()

  if (error || !collection) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === collection.user_id

  if (!collection.is_public && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4">
        <div className="glass-card rounded-2xl p-12 text-center max-w-md">
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
      sort_order,
      tools:tool_id (
        id, name, slug, tagline, description, website_url, logo_url,
        pricing_model, avg_rating, review_count, upvote_count,
        is_verified, has_api, is_open_source, use_cases,
        categories:category_id (name, slug, icon, color)
      )
    `)
    .eq('collection_id', collection.id)
    .order('sort_order', { ascending: true })

  const tools = (items?.map(i => i.tools) ?? []).filter(Boolean) as any[]

  const pricingCounts = tools.reduce((acc: Record<string, number>, t) => {
    acc[t.pricing_model] = (acc[t.pricing_model] ?? 0) + 1
    return acc
  }, {})

  const categories = [...new Map(
    tools.map(t => t.categories).filter(Boolean).map((c: any) => [c.slug, c])
  ).values()] as any[]

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/stacks/${slug}`
  const creator = (collection as any).profiles

  return (
    <div className="pb-24">

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-foreground/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-12">
          <Link
            href={isOwner ? '/dashboard' : '/tools'}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            {isOwner ? 'Back to Dashboard' : 'Browse Tools'}
          </Link>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-4 rounded-2xl bg-primary/15 border border-primary/20 shrink-0">
                <Layers className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight">{collection.name}</h1>
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
                  <p className="text-muted-foreground text-base leading-relaxed max-w-xl mt-2">
                    {collection.description}
                  </p>
                )}
                {creator && (
                  <p className="text-sm text-muted-foreground mt-3">
                    Curated by{' '}
                    <span className="font-semibold text-foreground">
                      {creator.display_name || creator.username || 'Anonymous'}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 shrink-0 flex-wrap">
              {collection.is_public && <ShareButton url={shareUrl} stackName={collection.name} />}
              {!isOwner && (
                <SaveStackButton
                  sourceCollectionId={collection.id}
                  stackName={collection.name}
                  toolIds={tools.map(t => t.id)}
                />
              )}
              {isOwner && (
                <Link href="/tools">
                  <Button variant="outline" className="gap-2">
                    <Zap className="h-4 w-4" /> Add Tools
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-6 mt-8 pt-6 border-t border-foreground/10">
            <div className="flex items-center gap-2 text-sm">
              <LayoutGrid className="h-4 w-4 text-primary" />
              <span className="font-bold">{tools.length}</span>
              <span className="text-muted-foreground">tool{tools.length !== 1 ? 's' : ''}</span>
            </div>
            {categories.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4 text-primary" />
                <span className="font-bold">{categories.length}</span>
                <span className="text-muted-foreground">categor{categories.length !== 1 ? 'ies' : 'y'}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                Created {new Date(collection.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            {Object.entries(pricingCounts).length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.entries(pricingCounts).map(([model, count]) => (
                  <span key={model} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${PRICING_BADGE_COLORS[model] ?? ''}`}>
                    {count} {PRICING_LABELS[model] ?? model}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="max-w-5xl mx-auto px-4 pt-10">
        {tools.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center border-dashed">
            <Layers className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-muted-foreground mb-2">This stack is empty</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {isOwner ? 'Browse tools and click "Add to Stack" to save them here.' : 'No tools have been added yet.'}
            </p>
            {isOwner && <Link href="/tools"><Button>Browse Tools</Button></Link>}
          </div>
        ) : (
          <div className="space-y-3">
            {tools.map((tool, i) => {
              const pricingColor = PRICING_BADGE_COLORS[tool.pricing_model] ?? PRICING_BADGE_COLORS.unknown
              const pricingLabel = PRICING_LABELS[tool.pricing_model] ?? 'Unknown'
              return (
                <div key={tool.id} className="glass-card card-hover rounded-xl overflow-hidden">
                  <div className="flex items-start gap-4 p-5">
                    <span className="text-xs font-black text-muted-foreground/30 w-5 shrink-0 pt-1 text-right tabular-nums">
                      {i + 1}
                    </span>
                    <div className="h-12 w-12 shrink-0 rounded-xl bg-muted border border-foreground/10 overflow-hidden flex items-center justify-center">
                      {tool.logo_url ? (
                        <Image src={tool.logo_url} alt={tool.name} width={48} height={48} className="object-contain" />
                      ) : (
                        <span className="font-black text-primary text-lg">{tool.name[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/tools/${tool.slug}`} className="font-bold text-[17px] leading-snug hover:text-primary transition-colors">
                              {tool.name}
                            </Link>
                            {tool.is_verified && <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />}
                            {tool.has_api && (
                              <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <Code2 className="h-2.5 w-2.5" /> API
                              </span>
                            )}
                            {tool.is_open_source && (
                              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                                Open Source
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm mt-1 leading-relaxed line-clamp-2">
                            {tool.tagline}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <a
                            href={tool.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/15 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Visit <ExternalLink className="h-3 w-3" />
                          </a>
                          <Badge variant="outline" className={`text-[11px] ${pricingColor}`}>
                            {pricingLabel}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-foreground/5 flex-wrap">
                        {tool.categories && (
                          <Link href={`/categories/${tool.categories.slug}`} className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
                            {tool.categories.icon} {tool.categories.name}
                          </Link>
                        )}
                        {tool.avg_rating > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span className="font-semibold text-foreground">{tool.avg_rating.toFixed(1)}</span>
                            <span>({tool.review_count})</span>
                          </div>
                        )}
                        {tool.upvote_count > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Zap className="h-3 w-3 text-primary" />
                            <span>{tool.upvote_count} upvotes</span>
                          </div>
                        )}
                        {tool.use_cases && tool.use_cases.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                            {(tool.use_cases as string[]).slice(0, 2).map((uc: string) => (
                              <span key={uc} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                                {uc}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
