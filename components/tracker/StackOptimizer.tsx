'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Zap, Wallet, ArrowRight, X, Repeat2 } from 'lucide-react'

type OptimizedTool = {
  name: string
  slug: string
  logo_url: string | null
  price: number
  reason: string
  action: 'keep' | 'replace' | 'drop'
  replaces: string | null
}

type OptimizedStack = {
  tools: OptimizedTool[]
  total_monthly: number
  summary: string
  mode: 'savings' | 'performance'
  current_monthly: number
  savings_monthly: number
  savings_yearly: number
}

type CurrentTool = {
  name: string
  slug: string
  logo_url: string | null
  cost: number
}

export function StackOptimizer({ currentTools }: { currentTools: CurrentTool[] }) {
  const [optimized, setOptimized] = useState<OptimizedStack | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'savings' | 'performance' | null>(null)

  const generate = async (m: 'savings' | 'performance') => {
    setMode(m)
    setLoading(true)
    setOptimized(null)
    setError(null)
    try {
      const res = await fetch(`/api/tracker/optimize?mode=${m}`)
      if (!res.ok) {
        setError(`Failed to generate (${res.status})`)
        setLoading(false)
        return
      }
      const d = await res.json()
      if (d.error) {
        setError(d.error)
      } else {
        setOptimized(d.optimized || null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    }
    setLoading(false)
  }

  if (currentTools.length < 2) return null

  const currentTotal = currentTools.reduce((s, t) => s + t.cost, 0)

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold flex items-center gap-2">
        <Repeat2 className="h-4 w-4 text-primary" />
        Stack Optimizer
      </h3>

      {/* Mode selector */}
      {!loading && !optimized && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => generate('savings')}
            className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.03] p-5 text-center hover:border-emerald-400/40 hover:bg-emerald-400/[0.06] transition-all cursor-pointer group"
          >
            <Wallet className="h-6 w-6 text-emerald-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-bold text-sm">Save Money</p>
            <p className="text-[11px] text-muted-foreground mt-1">Same job, lower cost</p>
          </button>
          <button
            onClick={() => generate('performance')}
            className="rounded-xl border border-violet-400/20 bg-violet-400/[0.03] p-5 text-center hover:border-violet-400/40 hover:bg-violet-400/[0.06] transition-all cursor-pointer group"
          >
            <Zap className="h-6 w-6 text-violet-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-bold text-sm">Best Performance</p>
            <p className="text-[11px] text-muted-foreground mt-1">Best-in-class for each job</p>
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-primary/15 bg-gradient-to-b from-primary/[0.03] to-transparent p-8 text-center space-y-3">
          <div className="relative h-10 w-10 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <div>
            <p className="text-sm font-bold">
              {mode === 'performance' ? 'Finding the best tools for each job...' : 'Finding cheaper alternatives...'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Comparing {currentTools.length} tools against our database</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/[0.04] p-4 text-center">
          <p className="text-sm text-destructive font-semibold mb-2">Couldn&apos;t generate optimization</p>
          <p className="text-xs text-muted-foreground mb-3">{error}</p>
          <button
            onClick={() => { setError(null); setMode(null) }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Side-by-side comparison */}
      {optimized && (
        <div className="space-y-4">
          {/* Summary */}
          <div className={`rounded-xl p-4 text-center border ${
            optimized.savings_monthly > 0
              ? 'border-emerald-400/20 bg-emerald-400/[0.04]'
              : optimized.savings_monthly < 0
                ? 'border-violet-400/20 bg-violet-400/[0.04]'
                : 'border-foreground/[0.06] bg-foreground/[0.02]'
          }`}>
            <p className="text-sm text-muted-foreground">{optimized.summary}</p>
            {optimized.savings_monthly > 0 && (
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                Save ${optimized.savings_yearly}/yr
              </p>
            )}
            {optimized.savings_monthly < 0 && (
              <p className="text-lg font-black text-violet-600 dark:text-violet-400 mt-1">
                +${Math.abs(optimized.savings_monthly)}/mo for top performance
              </p>
            )}
          </div>

          {/* Comparison columns */}
          {(() => {
            const droppedSlugs = new Set(optimized.tools.filter(t => t.action === 'drop').map(t => t.slug))
            const keptTools = optimized.tools.filter(t => t.action !== 'drop')
            return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Current stack */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 text-center">Your Stack</p>
              <div className="space-y-1.5">
                {currentTools.map((tool, i) => {
                  const isDropped = droppedSlugs.has(tool.slug)
                  return (
                    <div key={i} className={`rounded-lg border px-3 py-2 flex items-center gap-2 ${
                      isDropped ? 'border-destructive/20 bg-destructive/[0.03] opacity-60' : 'border-foreground/[0.06]'
                    }`}>
                      <div className="h-6 w-6 rounded-md overflow-hidden flex items-center justify-center shrink-0">
                        {tool.logo_url ? (
                          <img src={tool.logo_url} alt="" className="w-6 h-6 object-contain" />
                        ) : (
                          <span className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">{tool.name[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-semibold truncate ${isDropped ? 'line-through' : ''}`}>{tool.name}</p>
                        {isDropped && <p className="text-[9px] text-destructive">duplicate — drop</p>}
                      </div>
                      <span className={`text-[11px] font-bold shrink-0 ${isDropped ? 'line-through text-muted-foreground' : ''}`}>${tool.cost}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 text-center">
                <span className="text-sm font-black">${currentTotal}/mo</span>
              </div>
            </div>

            {/* Optimized stack — only kept + replaced, no drops */}
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 text-center ${
                mode === 'performance' ? 'text-violet-500' : 'text-emerald-500'
              }`}>
                {mode === 'performance' ? 'Best Performance' : 'Best Value'}
              </p>
              <div className="space-y-1.5">
                {keptTools.map((tool, i) => {
                  const isNew = tool.action === 'replace'
                  return (
                    <div key={i} className={`rounded-lg px-3 py-2 flex items-center gap-2 border ${
                      isNew
                        ? mode === 'performance'
                          ? 'border-violet-400/20 bg-violet-400/[0.04]'
                          : 'border-emerald-400/20 bg-emerald-400/[0.04]'
                        : 'border-foreground/[0.06]'
                    }`}>
                      <div className="h-6 w-6 rounded-md overflow-hidden flex items-center justify-center shrink-0">
                        {tool.logo_url ? (
                          <img src={tool.logo_url} alt="" className="w-6 h-6 object-contain" />
                        ) : (
                          <span className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">{tool.name[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold truncate">{tool.name}</p>
                        {isNew && <p className="text-[9px] text-muted-foreground truncate">replaces {tool.replaces}</p>}
                      </div>
                      <span className="text-[11px] font-bold shrink-0">${tool.price}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 text-center">
                <span className={`text-sm font-black ${
                  mode === 'performance' ? 'text-violet-600 dark:text-violet-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>${optimized.total_monthly}/mo</span>
              </div>
            </div>
          </div>
            )
          })()}

          {/* Tool reasons */}
          {optimized.tools.filter(t => t.action === 'replace').length > 0 && (
            <div className="rounded-xl border border-foreground/[0.06] p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Why these swaps</p>
              {optimized.tools.filter(t => t.action === 'replace').map((tool, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">{tool.replaces} → {tool.name}:</strong> {tool.reason}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Dropped tools reasoning */}
          {optimized.tools.filter(t => t.action === 'drop').length > 0 && (
            <div className="rounded-xl border border-foreground/[0.06] p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Duplicates to drop</p>
              {optimized.tools.filter(t => t.action === 'drop').map((tool, i) => (
                <div key={i} className="flex items-start gap-2">
                  <X className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">{tool.name} (${tool.price}/mo):</strong> {tool.reason}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => generate(mode === 'savings' ? 'performance' : 'savings')}
              className="flex-1 h-9 rounded-lg border border-foreground/10 text-xs font-semibold hover:bg-muted/50 transition-colors"
            >
              Try {mode === 'savings' ? 'Best Performance' : 'Save Money'}
            </button>
            <Link
              href={`/compare?tools=${optimized.tools.map(t => t.slug).join(',')}`}
              className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors"
            >
              Compare All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
