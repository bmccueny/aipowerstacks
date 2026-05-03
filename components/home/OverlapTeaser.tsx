import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

type OverlapCategory = {
  useCase: string
  label: string
  toolCount: number
  examples: { name: string; slug: string; logo_url: string | null }[]
}

export function OverlapTeaser({ overlaps }: { overlaps: OverlapCategory[] }) {
  if (overlaps.length === 0) return null

  return (
    <section className="px-4 max-w-4xl mx-auto w-full">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">Overlap alert</h2>
      <p className="text-base text-foreground font-medium mb-8">Are you paying twice for the same thing?</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {overlaps.map((overlap) => (
          <Link
            key={overlap.useCase}
            href={`/tools?use_case=${overlap.useCase}`}
            className="rounded-xl border border-foreground/[0.06] p-5 hover:border-primary/20 transition-all group"
          >
            <div className="flex gap-[-4px] mb-3">
              {overlap.examples.slice(0, 4).map((tool, i) => (
                <div
                  key={tool.slug}
                  className="h-8 w-8 rounded-lg bg-background border border-foreground/10 overflow-hidden flex items-center justify-center"
                  style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: 4 - i }}
                >
                  {tool.logo_url ? (
                    <img src={tool.logo_url} alt={tool.name} width={24} height={24} loading="lazy" decoding="async" className="w-6 h-6 object-contain" />
                  ) : (
                    <span className="text-[8px] font-bold text-primary">{tool.name[0]}</span>
                  )}
                </div>
              ))}
            </div>
            <p className="font-semibold text-sm mb-0.5 group-hover:text-primary transition-colors">{overlap.label}</p>
            <p className="text-xs text-muted-foreground">
              {overlap.toolCount} tools competing for your budget
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <Link
          href="/tracker"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          Find your overlaps <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}
