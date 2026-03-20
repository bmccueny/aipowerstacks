import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants/site'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Zap, Clock, BarChart3, ChevronRight, Layout, Sparkles
} from 'lucide-react'
import { AdoptBlueprintButton } from '@/components/blueprints/AdoptBlueprintButton'

export const metadata: Metadata = {
  title: 'Project Blueprints - AI Workflow Recipes',
  description: 'Pre-built AI tool recipes for high-impact workflows. One-click adopt expert stacks for content creation, development, marketing, data analysis, and more.',
  alternates: { canonical: '/blueprints' },
  openGraph: {
    title: 'Project Blueprints - AI Workflow Recipes',
    description: 'Pre-built AI tool recipes for high-impact workflows. One-click adopt expert stacks for content creation, development, marketing, data analysis, and more.',
    url: `${SITE_URL}/blueprints`,
    type: 'website',
    siteName: 'AIPowerStacks',
    images: [{ url: `${SITE_URL}/og-home-2026.jpg`, width: 1200, height: 630, alt: 'AIPowerStacks Project Blueprints' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@aipowerstacks',
    title: 'Project Blueprints - AI Workflow Recipes',
    description: 'Pre-built AI tool recipes for high-impact workflows. One-click adopt expert stacks for content creation, development, marketing, data analysis, and more.',
    images: [`${SITE_URL}/og-home-2026.jpg`],
  },
}

export default async function BlueprintsPage() {
  const supabase = await createClient()

  type BlueprintTool = { role: string; tools: { id: string; name: string; logo_url: string | null; slug: string } }
  type Blueprint = {
    id: string
    title: string
    description: string
    category: string
    estimated_time: string
    difficulty: string
    blueprint_tools: BlueprintTool[]
  }

  const { data } = await supabase
    .from('blueprints')
    .select(`
      *,
      blueprint_tools (
        role,
        tools:tool_id (id, name, logo_url, slug)
      )
    `)
    .order('created_at', { ascending: false })

  const blueprints = (data ?? []) as unknown as Blueprint[]

  return (
    <div className="page-shell pb-24">
        {/* Hero */}
        <section className="page-hero text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-sm text-muted-foreground mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Ready-to-Use AI Recipes</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Project <span className="text-primary">Blueprints</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stop searching and start building. Proven tool combinations for specific goals, ready to be added to your dashboard in one click.
          </p>
        </section>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blueprints.map((b) => {
            const bTools = b.blueprint_tools
            const toolIds = bTools.map((bt) => bt.tools.id)
            const toolNotes = bTools.reduce<Record<string, string>>((acc, bt) => {
              acc[bt.tools.id] = bt.role
              return acc
            }, {})

            return (
              <div key={b.id} className="glass-card rounded-md overflow-hidden flex flex-col group relative border-[1px] border-foreground/10 transition-all">
                <div className="h-1.5 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
                
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-black tracking-widest">
                      {b.category}
                    </Badge>
                    <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {b.estimated_time}</span>
                      <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {b.difficulty}</span>
                    </div>
                  </div>

                  <h2 className="text-2xl font-black mb-3 group-hover:text-primary transition-colors">{b.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-1">
                    {b.description}
                  </p>

                  {/* Ingredients */}
                  <div className="space-y-3 mb-8">
                    <p className="text-[10px] uppercase font-black tracking-widest text-foreground/40">The Ingredients</p>
                    <div className="grid grid-cols-1 gap-2">
                      {bTools.map((bt) => (
                        <div key={bt.tools.id} className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-foreground/5 group/tool">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-background flex items-center justify-center shrink-0 border border-foreground/10">
                              {bt.tools.logo_url ? (
                                <Image src={bt.tools.logo_url} alt={`${bt.tools.name} logo`} width={24} height={24} className="object-contain" />
                              ) : (
                                <span className="text-[10px] font-black text-primary">{bt.tools.name[0]}</span>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-black">{bt.tools.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{bt.role}</p>
                            </div>
                          </div>
                          <Link href={`/tools/${bt.tools.slug}`} className="opacity-100 sm:opacity-0 sm:group-hover/tool:opacity-100 transition-opacity">
                            <ChevronRight className="h-4 w-4 text-primary" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-6 border-t border-foreground/5 mt-auto">
                    <AdoptBlueprintButton
                      blueprintId={b.id}
                      title={b.title}
                      toolIds={toolIds}
                      toolNotes={toolNotes}
                    />
                    <Button variant="outline" className="h-11 w-11 p-0 border-foreground/10" title="View details">
                      <Layout className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
  )
}
