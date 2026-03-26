import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'

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
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Where people overspend
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Paying for multiple tools that do the same thing? You&apos;re not alone.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {overlaps.map((overlap) => (
          <div
            key={overlap.useCase}
            className="rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-5 text-center"
          >
            <p className="text-2xl font-black text-foreground">{overlap.toolCount}</p>
            <p className="text-sm font-semibold mt-1">{overlap.label} tools</p>
            <p className="text-xs text-muted-foreground mt-2">
              compete for your budget
            </p>
            <div className="flex justify-center gap-1 mt-3">
              {overlap.examples.map((tool) => (
                <div key={tool.slug} className="h-7 w-7 rounded-md bg-background border border-border overflow-hidden flex items-center justify-center">
                  {tool.logo_url ? (
                    <img src={tool.logo_url} alt="" className="w-6 h-6 object-contain" />
                  ) : (
                    <span className="text-[9px] font-bold text-primary">{tool.name[0]}</span>
                  )}
                </div>
              ))}
            </div>
            <Link
              href={`/tools?use_case=${overlap.useCase}`}
              className="text-xs text-primary hover:underline mt-3 inline-block"
            >
              Compare them →
            </Link>
          </div>
        ))}
      </div>

      <div className="text-center mt-6">
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
