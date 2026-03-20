import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants/site'
import { createClient } from '@/lib/supabase/server'
import { Layers, Zap, Users, Eye, Bookmark, Trophy } from 'lucide-react'
import { SaveStackButton } from '@/components/stacks/SaveStackButton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Power Stacks - Curated AI Tool Collections',
  description: 'Browse community-curated collections of AI tools organized by workflow. Find proven tool stacks for development, content creation, marketing, research, and more.',
  alternates: { canonical: '/stacks' },
  openGraph: {
    title: 'Power Stacks - Curated AI Tool Collections',
    description: 'Browse community-curated collections of AI tools organized by workflow. Find proven tool stacks for development, content creation, marketing, research, and more.',
    url: `${SITE_URL}/stacks`,
    type: 'website',
    siteName: 'AIPowerStacks',
    images: [{ url: `${SITE_URL}/og-home-v2.jpg`, width: 1200, height: 630, alt: 'AIPowerStacks Power Stacks' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@aipowerstacks',
    title: 'Power Stacks - Curated AI Tool Collections',
    description: 'Browse community-curated collections of AI tools organized by workflow. Find proven tool stacks for development, content creation, marketing, research, and more.',
    images: [`${SITE_URL}/og-home-v2.jpg`],
  },
}

export default async function StacksPage() {
  const supabase = await createClient()

  const { data: stacks, error } = await supabase
    .from('collections')
    .select(`
      id, name, description, share_slug, created_at, user_id,
      view_count, save_count,
      collection_items (
        tools:tool_id (id, name, logo_url)
      )
    `)
    .eq('is_public', true)
    .order('view_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(48)

  if (error) {
    console.error('Supabase error fetching stacks:', error.message)
  }

  const now = new Date().toISOString()
  const { data: activeChallenge } = await supabase
    .from('stack_challenges')
    .select('id, title, prompt, ends_at')
    .eq('is_active', true)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .limit(1)
    .maybeSingle()

  // Fetch profiles for these stacks separately to avoid join issues
  type StackRow = NonNullable<typeof stacks>[number]
  type StackCollectionItem = StackRow['collection_items'][number]
  type StackToolPreview = NonNullable<StackCollectionItem['tools']>
  type ProfileRow = { id: string; username: string | null; avatar_url: string | null; display_name: string | null }

  const userIds = [...new Set((stacks ?? []).map((s) => s.user_id))]
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, username, avatar_url, display_name').in('id', userIds)
    : { data: [] as ProfileRow[] }

  const profileMap = (profiles ?? []).reduce<Record<string, ProfileRow>>((acc, p) => {
    acc[p.id] = p
    return acc
  }, {})

  const enriched = (stacks ?? []).map((s) => ({
    ...s,
    profiles: profileMap[s.user_id] as ProfileRow | undefined,
    tools: (s.collection_items ?? [])
      .map((i: StackCollectionItem) => i.tools)
      .filter((t): t is StackToolPreview => Boolean(t))
      .slice(0, 5),
    toolCount: (s.collection_items ?? []).length,
  }))

  return (
    <div className="page-shell">

      <div className="page-hero text-center">
        <div className="inline-flex items-center gap-2 gum-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
          <Layers className="h-3.5 w-3.5" />
          Community Workflows
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-2">Power Stacks</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Community-curated collections of AI tools for every workflow. Browse, save, and build your own.
        </p>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
          <span><strong className="text-foreground">{enriched.length}</strong> public stacks</span>
          <span className="text-foreground/20">·</span>
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Community curated</span>
        </div>
      </div>

      {/* Active Challenge Banner */}
      {activeChallenge && (
        <Link href={`/stacks/challenges/${activeChallenge.id}`}>
          <div className="mb-8 glass-card rounded-md overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-400/60 via-amber-400 to-amber-400/60" />
            <div className="p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-md bg-amber-400/15 border border-amber-400/20 shrink-0">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-0.5">Challenge Live Now</p>
                <h3 className="font-bold text-base leading-tight">{activeChallenge.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{activeChallenge.prompt}</p>
              </div>
              <div className="text-xs font-semibold text-amber-500 shrink-0">
                Ends {new Date(activeChallenge.ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} →
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Grid */}
      {enriched.length === 0 ? (
        <div className="glass-card rounded-md p-16 text-center border-dashed">
          <Layers className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No public stacks yet</h2>
          <p className="text-sm text-muted-foreground mb-6">Be the first to create and share a Power Stack.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <Zap className="h-4 w-4" /> Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enriched.map((stack) => {
            const creator = stack.profiles
            const toolIds = (stack.collection_items ?? []).map((i: StackCollectionItem) => i.tools?.id).filter((id): id is string => Boolean(id))
            
            return (
              <div
                key={stack.id}
                className="glass-card rounded-md overflow-hidden flex flex-col group relative"
              >
                {/* Top accent */}
                <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

                <div className="p-5 flex flex-col gap-4 flex-1">
                  {/* Stack name + description */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <Link href={`/stacks/${stack.share_slug}`} className="block flex-1 min-w-0">
                        <h2 className="font-bold text-lg leading-snug group-hover:text-primary transition-colors line-clamp-1">
                          {stack.name}
                        </h2>
                      </Link>
                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <SaveStackButton
                          sourceCollectionId={stack.id}
                          stackName={stack.name}
                          toolIds={toolIds}
                          variant="icon"
                        />
                      </div>
                    </div>
                    <Link href={`/stacks/${stack.share_slug}`} className="block mt-1">
                      {stack.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                          {stack.description}
                        </p>
                      )}
                    </Link>
                  </div>

                  {/* Tool avatars + Engagement stats */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    {stack.tools.length > 0 && (
                      <Link href={`/stacks/${stack.share_slug}`} className="flex items-center gap-2">
                        <div className="flex items-center">
                          {stack.tools.map((tool: StackToolPreview, i: number) => (
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
                          {stack.toolCount} tool{stack.toolCount !== 1 ? 's' : ''}
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

                  {/* Creator */}
                  {creator && (
                    <div className="flex items-center gap-3 pt-4 border-t border-foreground/5">
                      <Avatar className="h-8 w-8 border-[1.5px] border-primary/20 shadow-sm">
                        <AvatarImage src={creator.avatar_url ?? undefined} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
                          {(creator.username || creator.display_name || 'A')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-none">Curated by</span>
                        </div>
                        {creator.username ? (
                          <Link href={`/curators/${creator.username}`} className="text-sm text-foreground font-bold leading-tight hover:text-primary transition-colors">
                            @{creator.username}
                          </Link>
                        ) : (
                          <span className="text-sm text-foreground font-bold leading-tight">
                            {creator.display_name || 'Anonymous'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 glass-card rounded-md p-8 text-center border-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
        <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold mb-2">Build your own Power Stack</h2>
        <p className="text-muted-foreground text-sm mb-5 max-w-sm mx-auto">
          Curate your favourite AI tools into a shareable stack. Share it with the world.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-md hover:bg-primary/90 transition-colors"
        >
          <Layers className="h-4 w-4" /> Create a Stack
        </Link>
      </div>
    </div>
  )
}
