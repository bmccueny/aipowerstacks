import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Zap, Clock, BarChart3, ChevronRight, Layout, Sparkles
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AdoptBlueprintButton } from '@/components/blueprints/AdoptBlueprintButton'

export const metadata = {
  title: 'Project Blueprints | AIPowerStacks',
  description: 'Proven AI tool recipes for high-impact workflows. One-click adopt expert stacks.',
}

export default async function BlueprintsPage() {
  const supabase = await createClient()

  const { data: blueprints } = await supabase
    .from('blueprints')
    .select(`
      *,
      blueprint_tools (
        role,
        tools:tool_id (id, name, logo_url, slug)
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen page-shell pb-24">
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
          {(blueprints ?? []).map((b: any) => {
            const toolIds = b.blueprint_tools.map((bt: any) => bt.tools.id)
            const toolNotes = b.blueprint_tools.reduce((acc: any, bt: any) => {
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
                      {b.blueprint_tools.map((bt: any) => (
                        <div key={bt.tools.id} className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-foreground/5 group/tool">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-background flex items-center justify-center shrink-0 border border-foreground/10">
                              {bt.tools.logo_url ? (
                                <img src={bt.tools.logo_url} alt="" className="h-6 w-6 object-contain" />
                              ) : (
                                <span className="text-[10px] font-black text-primary">{bt.tools.name[0]}</span>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-black">{bt.tools.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{bt.role}</p>
                            </div>
                          </div>
                          <Link href={`/tools/${bt.tools.slug}`} className="opacity-0 group-hover/tool:opacity-100 transition-opacity">
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
      </main>
  )
}
