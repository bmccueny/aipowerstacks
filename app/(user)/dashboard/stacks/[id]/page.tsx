import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShareButton } from '@/components/stacks/ShareButton'
import { RemoveFromStackButton } from '@/components/stacks/RemoveFromStackButton'
import { EditStackPanel } from '@/components/stacks/EditStackPanel'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'
import {
  Layers, Globe, Lock, ArrowLeft, ExternalLink,
  Star, ShieldCheck, Code2, Zap, CalendarDays, LayoutGrid,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Power Stack' }

export default async function StackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: collection } = await supabase
    .from('collections')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!collection) notFound()

  const { data: items } = await supabase
    .from('collection_items')
    .select(`
      sort_order,
      tools:tool_id (
        id, name, slug, tagline, website_url, logo_url,
        pricing_model, avg_rating, review_count, upvote_count,
        is_verified, has_api, is_open_source, use_cases,
        categories:category_id (name, slug, icon, color)
      )
    `)
    .eq('collection_id', id)
    .order('sort_order', { ascending: true })

  const tools = (items?.map(i => i.tools) ?? []).filter(Boolean) as any[]

  const categories = [...new Map(
    tools.map(t => t.categories).filter(Boolean).map((c: any) => [c.slug, c])
  ).values()] as any[]

  const pricingCounts = tools.reduce((acc: Record<string, number>, t) => {
    acc[t.pricing_model] = (acc[t.pricing_model] ?? 0) + 1
    return acc
  }, {})

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/stacks/${collection.share_slug}`

  return (
    <div className="pb-10">

      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Hero card */}
      <div className="relative glass-card rounded-2xl overflow-hidden mb-8 border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

        <div className="p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-4 rounded-2xl bg-primary/15 border border-primary/20 shrink-0">
                <Layers className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight mb-2">{collection.name}</h1>
                {collection.description && (
                  <p className="text-muted-foreground leading-relaxed max-w-lg">{collection.description}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
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
              </div>
            </div>

            <div className="flex gap-2 shrink-0 flex-wrap">
              {collection.is_public && <ShareButton url={shareUrl} stackName={collection.name} />}
              <Link href="/tools">
                <Button variant="outline" className="gap-2">
                  <Zap className="h-4 w-4" /> Add Tools
                </Button>
              </Link>
              <EditStackPanel
                collectionId={collection.id}
                initialName={collection.name}
                initialDescription={collection.description}
                initialIsPublic={collection.is_public}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-foreground/10">
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
      {tools.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <Layers className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">This stack is empty</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Browse tools and click &quot;Add to Stack&quot; to save them here.
          </p>
          <Link href="/tools"><Button>Browse Tools</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tools.map((tool, i) => {
            const pricingColor = PRICING_BADGE_COLORS[tool.pricing_model] ?? PRICING_BADGE_COLORS.unknown
            const pricingLabel = PRICING_LABELS[tool.pricing_model] ?? 'Unknown'
            return (
              <div key={tool.id} className="glass-card card-hover rounded-xl group">
                <div className="flex items-start gap-4 p-5">

                  {/* Number */}
                  <span className="text-xs font-black text-muted-foreground/30 w-5 shrink-0 pt-2 text-right tabular-nums select-none">
                    {i + 1}
                  </span>

                  {/* Logo */}
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-muted border border-foreground/10 overflow-hidden flex items-center justify-center">
                    {tool.logo_url ? (
                      <Image src={tool.logo_url} alt={tool.name} width={48} height={48} className="object-contain" />
                    ) : (
                      <span className="font-black text-primary text-lg">{tool.name[0]}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/tools/${tool.slug}`}
                            className="font-bold text-[17px] leading-snug hover:text-primary transition-colors"
                          >
                            {tool.name}
                          </Link>
                          {tool.is_verified && <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />}
                          {tool.has_api && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 px-1.5 py-0.5 rounded-full">
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

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={tool.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/15 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Visit <ExternalLink className="h-3 w-3" />
                        </a>
                        <RemoveFromStackButton collectionId={id} toolId={tool.id} toolName={tool.name} />
                      </div>
                    </div>

                    {/* Footer meta */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-foreground/5 flex-wrap">
                      <Badge variant="outline" className={`text-[11px] ${pricingColor}`}>
                        {pricingLabel}
                      </Badge>
                      {tool.categories && (
                        <Link
                          href={`/categories/${tool.categories.slug}`}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                        >
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
                      {tool.use_cases && (tool.use_cases as string[]).length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                          {(tool.use_cases as string[]).slice(0, 3).map((uc: string) => (
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
  )
}
