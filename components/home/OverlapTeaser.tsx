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
    <section className="px-4 max-w-3xl mx-auto w-full">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="pulse-dot" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">Overlap Alert</p>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          Are you paying twice for the same thing?
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 stagger-in">
        {overlaps.map((overlap) => (
          <div
            key={overlap.useCase}
            className="bento-card text-center"
          >
            <div className="flex justify-center mb-3">
              {overlap.examples.slice(0, 4).map((tool, i) => (
                <div
                  key={tool.slug}
                  className="h-9 w-9 rounded-xl bg-[#09090b] border border-white/10 overflow-hidden flex items-center justify-center"
                  style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: 4 - i }}
                >
                  {tool.logo_url ? (
                    <img src={tool.logo_url} alt={tool.name} className="w-7 h-7 object-contain" />
                  ) : (
                    <span className="text-[9px] font-bold text-primary">{tool.name[0]}</span>
                  )}
                </div>
              ))}
            </div>
            <p className="font-bold text-sm mb-0.5">{overlap.label}</p>
            <p className="text-xs text-muted-foreground">
              {overlap.toolCount} tools competing for your budget
            </p>
            <div className="mt-3">
              <Link
                href={`/tools?use_case=${overlap.useCase}`}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Compare them →
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Link
          href="/tracker"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          Find your overlaps <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}
