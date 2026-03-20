import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { SITE_URL } from '@/lib/constants/site'
import { PRICING_LABELS } from '@/lib/constants'

interface Props {
  searchParams: Promise<{ tools?: string; q?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { tools: toolSlugs, q } = await searchParams
  if (!toolSlugs) return { title: 'AI Stack Results | AIPowerStacks' }

  const slugs = toolSlugs.split(',').slice(0, 6)
  const supabase = createAdminClient()
  const { data: tools } = await supabase
    .from('tools')
    .select('name')
    .in('slug', slugs)
    .eq('status', 'published')

  const names = (tools ?? []).map(t => t.name)
  const title = q
    ? `AI Stack for "${q}" | AIPowerStacks`
    : `${names.join(', ')} | AI Stack | AIPowerStacks`
  const description = q
    ? `${names.length} tools matched for "${q}": ${names.join(', ')}. Find your perfect AI stack on AIPowerStacks.`
    : `A curated AI stack of ${names.length} tools: ${names.join(', ')}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/matchmaker/results?tools=${toolSlugs}`,
      siteName: 'AIPowerStacks',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function MatchmakerResultsPage({ searchParams }: Props) {
  const { tools: toolSlugs, q } = await searchParams

  if (!toolSlugs) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-24 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">No tools selected</h1>
          <Link href="/matchmaker">
            <Button>Try the AI Matchmaker</Button>
          </Link>
        </main>
        <Footer />
      </>
    )
  }

  const slugs = toolSlugs.split(',').slice(0, 6)
  const supabase = createAdminClient()
  const { data: tools } = await supabase
    .from('tools')
    .select('id, name, slug, tagline, logo_url, pricing_model, avg_rating, review_count, is_verified')
    .in('slug', slugs)
    .eq('status', 'published')

  const orderedTools = slugs
    .map(s => (tools ?? []).find(t => t.slug === s))
    .filter(Boolean) as NonNullable<typeof tools>[number][]

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-semibold uppercase tracking-widest mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              AI Matchmaker Result
            </div>
            {q ? (
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                AI Stack for &ldquo;{q}&rdquo;
              </h1>
            ) : (
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                Your AI Stack ({orderedTools.length} tools)
              </h1>
            )}
            <p className="text-muted-foreground">
              Matched by the AIPowerStacks AI Matchmaker. Try it yourself.
            </p>
          </div>

          <div className="space-y-3 mb-10">
            {orderedTools.map((tool, i) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.slug}`}
                className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-all group"
              >
                <span className="text-lg font-black text-muted-foreground/40 w-6 text-center shrink-0">{i + 1}</span>
                <div className="h-11 w-11 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                  {tool.logo_url ? (
                    <Image src={tool.logo_url} alt={tool.name} width={44} height={44} className="object-contain" />
                  ) : (
                    <span className="text-lg font-bold text-primary">{tool.name[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold group-hover:text-primary transition-colors">{tool.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{tool.tagline}</p>
                </div>
                <span className="text-xs font-semibold text-muted-foreground shrink-0">
                  {PRICING_LABELS[tool.pricing_model ?? ''] ?? 'Unknown'}
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center space-y-4">
            <Link href="/matchmaker">
              <Button size="lg" className="gap-2 font-bold">
                <Sparkles className="h-4 w-4" /> Build Your Own Stack
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              Powered by AIPowerStacks AI Matchmaker
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
