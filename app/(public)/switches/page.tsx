import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, TrendingDown } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'Tool Switch Stories | What People Are Switching To',
  description: 'See what AI tools people are switching from and to, with reasons and satisfaction scores. Real decisions from real users.',
}

export const revalidate = 300

type SwitchStory = {
  id: string
  reason: string | null
  satisfaction: number | null
  created_at: string
  from_tool: { name: string; slug: string; logo_url: string | null } | null
  to_tool: { name: string; slug: string; logo_url: string | null } | null
  profiles: { display_name: string | null; username: string | null } | null
}

export default async function SwitchesPage() {
  const supabase = createAdminClient()

  const { data: rawSwitches } = await supabase
    .from('tool_switches')
    .select('id, reason, satisfaction, created_at, from_tool:from_tool_id(name, slug, logo_url), to_tool:to_tool_id(name, slug, logo_url), profiles:user_id(display_name, username)')
    .order('created_at', { ascending: false })
    .limit(50)

  const switches = (rawSwitches ?? []) as unknown as SwitchStory[]

  return (
    <main className="min-h-[100dvh] pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3 flex items-center gap-2">
            <span className="w-5 h-px bg-primary/60" /> Community
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em]">Switch Stories</h1>
          <p className="mt-3 text-base text-muted-foreground max-w-md">
            Real decisions from real users — what they switched from, what they switched to, and why.
          </p>
        </div>

        {switches.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
            <TrendingDown className="h-8 w-8 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-bold text-lg mb-2">No switch stories yet</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Be the first to share — when you remove a tool from your tracker and add a replacement, we&apos;ll ask if you want to share why.
            </p>
            <Link href="/tracker" className="inline-flex items-center gap-2 h-10 px-6 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
              Go to Tracker <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {switches.map(story => (
              <div key={story.id} className="rounded-xl border border-border p-5">
                <div className="flex items-center gap-3 mb-3">
                  {/* From tool */}
                  <Link href={`/tools/${story.from_tool?.slug ?? ''}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                    {story.from_tool?.logo_url ? (
                      <img src={story.from_tool.logo_url} alt="" className="w-7 h-7 rounded-md object-contain" />
                    ) : (
                      <span className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-[9px] font-bold">{story.from_tool?.name?.[0]}</span>
                    )}
                    <span className="text-sm font-semibold line-through decoration-muted-foreground/40">{story.from_tool?.name}</span>
                  </Link>

                  <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />

                  {/* To tool */}
                  <Link href={`/tools/${story.to_tool?.slug ?? ''}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                    {story.to_tool?.logo_url ? (
                      <img src={story.to_tool.logo_url} alt="" className="w-7 h-7 rounded-md object-contain" />
                    ) : (
                      <span className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">{story.to_tool?.name?.[0]}</span>
                    )}
                    <span className="text-sm font-bold">{story.to_tool?.name}</span>
                  </Link>
                </div>

                {story.reason && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">&ldquo;{story.reason}&rdquo;</p>
                )}

                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span>{story.profiles?.display_name ?? 'Anonymous'}</span>
                  {story.satisfaction != null && (
                    <span className={story.satisfaction >= 4 ? 'text-emerald-600' : story.satisfaction >= 3 ? 'text-amber-600' : 'text-red-500'}>
                      {'★'.repeat(story.satisfaction)}{'☆'.repeat(5 - story.satisfaction)} satisfaction
                    </span>
                  )}
                  <span>{new Date(story.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
