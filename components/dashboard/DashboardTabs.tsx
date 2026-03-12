'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Layers, Bookmark, Star, Send, Globe, Lock, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DeleteStackButton } from '@/components/tools/DeleteStackButton'
import { CreateStackDialog } from '@/components/stacks/CreateStackDialog'
import { UnsaveStackButton } from '@/components/stacks/UnsaveStackButton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useLiquidGlass } from '@/hooks/useLiquidGlass'

type Tool = { id: string; name: string; slug: string; logo_url: string | null }

type MyStack = {
  id: string; name: string; icon: string | null; is_public: boolean; share_slug: string
  view_count: number; save_count: number
  collection_items: { tools: Tool }[]
}

type SavedStack = {
  id: string; name: string; icon: string | null; share_slug: string; isLinked: boolean
  profiles?: { username: string; display_name: string; avatar_url: string | null }
  collection_items: { tools: Tool }[]
}

type Review = {
  id: string; rating: number; title: string | null; created_at: string; status: string
  tools: { id: string; name: string; slug: string }
}

type Submission = { id: string; name: string; status: string; created_at: string }
type Tab = 'stacks' | 'saved' | 'reviews' | 'submissions'

export function DashboardTabs({
  myStacks,
  savedStacks,
  reviews,
  submissions,
  statusColors,
}: {
  myStacks: MyStack[]
  savedStacks: SavedStack[]
  reviews: Review[]
  submissions: Submission[]
  statusColors: Record<string, string>
}) {
  const [active, setActive] = useState<Tab>('stacks')

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'stacks',      label: 'My Stacks',   icon: Layers,   count: myStacks.length },
    { id: 'saved',       label: 'Saved',        icon: Bookmark, count: savedStacks.length },
    { id: 'reviews',     label: 'Reviews',      icon: Star,     count: reviews.length },
    { id: 'submissions', label: 'Submissions',  icon: Send,     count: submissions.length },
  ]

  const glassRef = useLiquidGlass<HTMLDivElement>({ radius: 12 })

  return (
    <div>
      {/* Tab bar */}
      <div ref={glassRef} className="liquid-glass glass-card rounded-xl p-1 grid grid-cols-2 sm:grid-cols-4 gap-1 mb-8 border border-white/15">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold rounded-md transition-colors ${
              active === id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black shrink-0 ${
              active === id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Stacks */}
      {active === 'stacks' && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black tracking-tight">My Power Stacks</h2>
            <CreateStackDialog />
          </div>
          {myStacks.length === 0 ? (
            <div className="glass-card rounded-md p-12 text-center border-dashed">
              <Layers className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium mb-4">You haven't built any Power Stacks yet.</p>
              <CreateStackDialog />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myStacks.map((stack) => {
                const tools = stack.collection_items.map((i) => i.tools).filter(Boolean)
                return (
                  <div key={stack.id} className="glass-card rounded-md overflow-hidden flex flex-col group border-b-2 border-b-primary/20">
                    <div className="p-5 flex flex-col gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <Link href={`/stacks/${stack.share_slug}`} className="block flex-1 min-w-0">
                            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                              <span className="mr-2 text-xl">{stack.icon || '⚡'}</span>
                              {stack.name}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-1">
                            {stack.is_public
                              ? <Globe className="h-3 w-3 text-emerald-500" />
                              : <Lock className="h-3 w-3 text-muted-foreground" />
                            }
                            <DeleteStackButton collectionId={stack.id} stackName={stack.name} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Eye className="h-2.5 w-2.5" /> {stack.view_count || 0}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Bookmark className="h-2.5 w-2.5" /> {stack.save_count || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 pt-1 border-t border-foreground/5 mt-auto">
                        {tools.length > 0 ? (
                          <div className="flex -space-x-2">
                            {tools.slice(0, 4).map((tool, i) => (
                              <div key={i} className="h-7 w-7 rounded-full bg-muted border-2 border-background overflow-hidden flex items-center justify-center shrink-0">
                                {tool.logo_url
                                  ? <Image src={tool.logo_url} alt={`${tool.name} logo`} width={20} height={20} className="object-contain" />
                                  : <span className="text-[10px] font-black text-primary">{tool.name[0]}</span>
                                }
                              </div>
                            ))}
                            {tools.length > 4 && (
                              <div className="h-7 w-7 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center shrink-0">
                                <span className="text-[8px] font-black text-primary">+{tools.length - 4}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Empty stack</span>
                        )}
                        <Link href={`/stacks/${stack.share_slug}`} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                          Open
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Saved Stacks */}
      {active === 'saved' && (
        <section>
          <h2 className="text-xl font-black tracking-tight mb-6">Saved Stacks</h2>
          {savedStacks.length === 0 ? (
            <div className="glass-card rounded-md p-12 text-center border-dashed">
              <p className="text-muted-foreground text-sm">You haven't saved any stacks yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedStacks.map((stack) => {
                const tools = stack.collection_items.map((i) => i.tools).filter(Boolean)
                return (
                  <div key={stack.id} className="glass-card rounded-md overflow-hidden flex flex-col group border-b-2 border-b-muted">
                    <div className="p-5 flex flex-col gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <Link href={`/stacks/${stack.share_slug}`} className="block flex-1 min-w-0">
                            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                              <span className="mr-2 text-xl">{stack.icon || '⚡'}</span>
                              {stack.name}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2">
                            {stack.isLinked ? (
                              <>
                                <Badge variant="outline" className="text-[8px] uppercase tracking-widest px-1.5 py-0">Followed</Badge>
                                <UnsaveStackButton collectionId={stack.id} stackName={stack.name} variant="icon" />
                              </>
                            ) : (
                              <DeleteStackButton collectionId={stack.id} stackName={stack.name} />
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5">
                          by
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={stack.profiles?.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[6px] font-black">{stack.profiles?.username?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-foreground">@{stack.profiles?.username || 'curator'}</span>
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 pt-1 border-t border-foreground/5 mt-auto">
                        <div className="flex -space-x-2">
                          {tools.slice(0, 4).map((tool, i) => (
                            <div key={i} className="h-7 w-7 rounded-full bg-muted border-2 border-background overflow-hidden flex items-center justify-center shrink-0">
                              {tool.logo_url
                                ? <Image src={tool.logo_url} alt={`${tool.name} logo`} width={20} height={20} className="object-contain" />
                                : <span className="text-[10px] font-black text-primary">{tool.name[0]}</span>
                              }
                            </div>
                          ))}
                        </div>
                        <Link href={`/stacks/${stack.share_slug}`} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                          Open
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Reviews */}
      {active === 'reviews' && (
        <section>
          <h2 className="text-xl font-black tracking-tight mb-6">My Reviews</h2>
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="glass-card p-6 rounded-md text-center">
                <p className="text-xs text-muted-foreground">No reviews yet.</p>
              </div>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="glass-card p-4 rounded-md flex items-center gap-4">
                  <div className="flex items-center gap-0.5 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-primary text-primary' : 'text-muted-foreground/20'}`} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/tools/${r.tools.slug}`} className="text-sm font-bold hover:underline line-clamp-1">{r.tools.name}</Link>
                    {r.title && <p className="text-[10px] text-muted-foreground line-clamp-1 italic">"{r.title}"</p>}
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border shrink-0 ${statusColors[r.status] || ''}`}>
                    {r.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Submissions */}
      {active === 'submissions' && (
        <section>
          <h2 className="text-xl font-black tracking-tight mb-6">Submissions</h2>
          <div className="space-y-3">
            {submissions.length === 0 ? (
              <div className="glass-card p-6 rounded-md text-center">
                <p className="text-xs text-muted-foreground">No submissions yet.</p>
              </div>
            ) : (
              submissions.map((s) => (
                <div key={s.id} className="glass-card p-4 rounded-md flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{s.name}</p>
                    <p className="text-[9px] text-muted-foreground">Submitted {new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border shrink-0 ${statusColors[s.status] || ''}`}>
                    {s.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  )
}
