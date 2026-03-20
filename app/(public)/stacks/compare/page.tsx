import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { StackCompareSearch } from '@/components/stacks/StackCompareSearch'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'
import { Layers, ArrowLeft, Check, X, Eye, Bookmark } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export const metadata: Metadata = {
  title: 'Compare Power Stacks',
  description: 'Compare two AI Power Stacks side-by-side. See shared tools, unique tools, and differences at a glance to pick the right workflow for your needs.',
  alternates: { canonical: '/stacks/compare' },
  openGraph: {
    title: 'Compare Power Stacks',
    description: 'Compare two AI Power Stacks side-by-side. See shared tools, unique tools, and differences at a glance.',
    type: 'website',
    siteName: 'AIPowerStacks',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@aipowerstacks',
    title: 'Compare Power Stacks',
    description: 'Compare two AI Power Stacks side-by-side. See shared tools, unique tools, and differences at a glance.',
  },
}

async function fetchStack(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
  const { data: collection } = await supabase
    .from('collections')
    .select('id, name, description, share_slug, icon, view_count, save_count, profiles:user_id(display_name, avatar_url, username)')
    .eq('share_slug', slug)
    .eq('is_public', true)
    .single()

  if (!collection) return null

  const { data: items } = await supabase
    .from('collection_items')
    .select('tool_id, tools:tool_id(id, name, slug, tagline, logo_url, pricing_model)')
    .eq('collection_id', collection.id)
    .order('sort_order', { ascending: true })

  type CompareToolRow = NonNullable<NonNullable<typeof items>[number]['tools']>

  return {
    ...collection,
    tools: (items?.map((i) => i.tools).filter((t): t is CompareToolRow => Boolean(t)) ?? []),
  }
}

export default async function StackComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>
}) {
  const { a: slugA, b: slugB } = await searchParams
  const supabase = await createClient()

  const [stackA, stackB] = await Promise.all([
    slugA ? fetchStack(supabase, slugA) : null,
    slugB ? fetchStack(supabase, slugB) : null,
  ])

  type StackResult = NonNullable<Awaited<ReturnType<typeof fetchStack>>>
  type CompareTool = StackResult['tools'][number]

  const toolsA = stackA?.tools ?? []
  const toolsB = stackB?.tools ?? []
  const idsA = new Set(toolsA.map((t) => t.id))
  const idsB = new Set(toolsB.map((t) => t.id))

  const toolMap = new Map<string, CompareTool>()
  ;[...toolsA, ...toolsB].forEach((t) => toolMap.set(t.id, t))
  const allToolIds = new Set([...idsA, ...idsB])

  const allTools = [...allToolIds].map((id) => ({
    tool: toolMap.get(id)!,
    inA: idsA.has(id),
    inB: idsB.has(id),
  }))

  const sortedTools = [
    ...allTools.filter((t) => t.inA && t.inB),
    ...allTools.filter((t) => t.inA && !t.inB),
    ...allTools.filter((t) => !t.inA && t.inB),
  ]

  const overlapCount = allTools.filter((t) => t.inA && t.inB).length
  const onlyACount = allTools.filter((t) => t.inA && !t.inB).length
  const onlyBCount = allTools.filter((t) => !t.inA && t.inB).length

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 pb-24">
      <Link
        href="/stacks"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Stacks
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-2">Compare Stacks</h1>
        <p className="text-muted-foreground">
          See how two Power Stacks overlap and differ.
        </p>
      </div>

      <Suspense>
        <StackCompareSearch paramA={slugA ?? null} paramB={slugB ?? null} />
      </Suspense>

      {(!stackA || !stackB) && (
        <div className="mt-8 glass-card rounded-md p-12 text-center border-dashed">
          <Layers className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {!slugA && !slugB
              ? 'Search for a stack above to start comparing.'
              : !stackA
              ? 'Stack A not found or is private. Try a different stack.'
              : 'Search for a second stack above to compare.'}
          </p>
        </div>
      )}

      {stackA && stackB && (
        <>
          {/* Two-column headers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 mb-4">
            {([stackA, stackB] as StackResult[]).map((stack, i) => {
              const creator = stack.profiles
              const label = i === 0 ? 'A' : 'B'
              return (
                <div key={stack.id} className="glass-card rounded-md p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-md bg-primary/15 border border-primary/20 shrink-0 flex items-center justify-center text-xl">
                      {stack.icon || '⚡'}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/stacks/${stack.share_slug}`}
                        className="font-bold text-base leading-tight hover:text-primary transition-colors line-clamp-1 block"
                      >
                        {stack.name}
                      </Link>
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">
                        Stack {label}
                      </span>
                    </div>
                  </div>
                  {creator?.username && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Avatar className="h-4 w-4 border border-primary/10">
                        <AvatarImage src={creator.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[6px] font-black">
                          {(creator.display_name || creator.username || '?')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Link href={`/curators/${creator.username}`} className="hover:text-primary transition-colors">
                        @{creator.username}
                      </Link>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {stack.view_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bookmark className="h-3 w-3" /> {stack.save_count || 0}
                    </span>
                    <span>{stack.tools.length} tool{stack.tools.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Overlap summary */}
          <div className="flex items-center gap-4 mb-6 text-sm">
            <span>
              <span className="font-bold text-emerald-500">{overlapCount}</span>{' '}
              <span className="text-muted-foreground">shared</span>
            </span>
            <span>
              <span className="font-bold">{onlyACount}</span>{' '}
              <span className="text-muted-foreground">only in A</span>
            </span>
            <span>
              <span className="font-bold">{onlyBCount}</span>{' '}
              <span className="text-muted-foreground">only in B</span>
            </span>
          </div>

          {sortedTools.length === 0 ? (
            <div className="glass-card rounded-md p-12 text-center">
              <p className="text-muted-foreground text-sm">Both stacks are empty.</p>
            </div>
          ) : (
            <div className="glass-card rounded-md overflow-hidden">
              <div className="grid grid-cols-[1fr_72px_72px] border-b border-foreground/10 px-4 py-2.5 bg-muted/30">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tool</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center truncate">
                  {stackA.name.length > 6 ? stackA.name.slice(0, 6) + '…' : stackA.name}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center truncate">
                  {stackB.name.length > 6 ? stackB.name.slice(0, 6) + '…' : stackB.name}
                </span>
              </div>
              <div className="divide-y divide-foreground/5">
                {sortedTools.map(({ tool, inA, inB }) => (
                  <div key={tool.id} className="grid grid-cols-[1fr_72px_72px] items-center px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded shrink-0 bg-muted border border-foreground/10 overflow-hidden flex items-center justify-center">
                        {tool.logo_url ? (
                          <Image
                            src={tool.logo_url}
                            alt={tool.name}
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-primary">{tool.name[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/tools/${tool.slug}`}
                          className="text-sm font-semibold hover:text-primary transition-colors truncate block"
                        >
                          {tool.name}
                        </Link>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${PRICING_BADGE_COLORS[tool.pricing_model] ?? ''}`}
                          >
                            {PRICING_LABELS[tool.pricing_model] ?? 'Unknown'}
                          </Badge>
                          {inA && inB && (
                            <span className="text-[10px] text-emerald-500 font-semibold">Shared</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      {inA ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/25" />
                      )}
                    </div>
                    <div className="flex justify-center">
                      {inB ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/25" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
