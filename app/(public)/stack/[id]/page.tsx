import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

type SnapshotTool = {
  name: string
  slug: string
  logo_url: string | null
  pricing_model: string
  monthly_cost: number
  category: string | null
}

type SharedStack = {
  id: string
  display_name: string | null
  snapshot: SnapshotTool[]
  total_monthly: number
  tool_count: number
  grade: string | null
  created_at: string
  updated_at: string
}

type PageProps = {
  params: Promise<{ id: string }>
}

async function getStack(id: string): Promise<SharedStack | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('shared_stacks')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return {
    ...data,
    snapshot: (data.snapshot as unknown as SnapshotTool[]) || [],
  } as SharedStack
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const stack = await getStack(id)
  if (!stack) return { title: 'Stack Not Found' }

  const name = stack.display_name ? `${stack.display_name}'s` : 'An'
  const title = `${name} AI Stack — ${stack.tool_count} tools, $${Math.round(stack.total_monthly)}/mo`
  const description = `Check out this curated AI tool stack: ${stack.snapshot.slice(0, 5).map(t => t.name).join(', ')}${stack.tool_count > 5 ? ` and ${stack.tool_count - 5} more` : ''}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
    case 'B': return 'text-blue-500 border-blue-500/30 bg-blue-500/10'
    case 'C': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
    case 'D': return 'text-orange-500 border-orange-500/30 bg-orange-500/10'
    default: return 'text-red-500 border-red-500/30 bg-red-500/10'
  }
}

function getPricingBadge(model: string): { label: string; className: string } {
  switch (model) {
    case 'free': return { label: 'Free', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' }
    case 'freemium': return { label: 'Freemium', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' }
    case 'paid': return { label: 'Paid', className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' }
    case 'trial': return { label: 'Trial', className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' }
    default: return { label: model, className: 'bg-muted text-muted-foreground' }
  }
}

export default async function SharedStackPage({ params }: PageProps) {
  const { id } = await params
  const stack = await getStack(id)
  if (!stack) notFound()

  const tools = stack.snapshot
  const categories = [...new Set(tools.map(t => t.category).filter((c): c is string => c != null))]

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        {stack.display_name && (
          <p className="text-sm text-muted-foreground">{stack.display_name}&apos;s</p>
        )}
        <h1 className="text-3xl font-bold">AI Tool Stack</h1>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>{stack.tool_count} tools</span>
          <span className="text-foreground/20">•</span>
          <span>${Math.round(stack.total_monthly)}/mo</span>
          <span className="text-foreground/20">•</span>
          <span>${Math.round(stack.total_monthly * 12)}/yr</span>
          {stack.grade && (
            <>
              <span className="text-foreground/20">•</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-bold ${getGradeColor(stack.grade)}`}>
                {stack.grade}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Tool cards */}
      <div className="space-y-3">
        {tools.map((tool, i) => {
          const badge = getPricingBadge(tool.pricing_model)
          return (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-foreground/[0.06] p-4 hover:bg-muted/30 transition-colors">
              {/* Logo */}
              <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
                {tool.logo_url ? (
                  <Image src={tool.logo_url} alt={tool.name} width={40} height={40} className="object-contain" />
                ) : (
                  <span className="text-lg font-bold text-muted-foreground">{tool.name.charAt(0)}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/tools/${tool.slug}`} className="font-medium hover:underline truncate">
                    {tool.name}
                  </Link>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
                {tool.category && (
                  <p className="text-xs text-muted-foreground mt-0.5">{tool.category}</p>
                )}
              </div>

              {/* Cost */}
              <div className="text-right shrink-0">
                <span className="font-medium">
                  {tool.monthly_cost === 0 ? 'Free' : `$${tool.monthly_cost.toFixed(0)}/mo`}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Categories summary */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map(cat => (
            <span key={cat} className="text-xs px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground">
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="text-center pt-4 border-t border-foreground/[0.06]">
        <p className="text-sm text-muted-foreground mb-3">
          Track your own AI spending and get a stack score
        </p>
        <Link
          href="/tracker"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Build Your Stack →
        </Link>
      </div>
    </div>
  )
}
