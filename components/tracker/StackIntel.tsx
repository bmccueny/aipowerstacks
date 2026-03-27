'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, ChevronDown, ChevronUp, Users, CalendarCheck, BarChart3, Brain, ArrowRight } from 'lucide-react'

type ScoreBreakdown = {
  total: number
  efficiency: { score: number; max: number; label: string }
  quality: { score: number; max: number; label: string }
  coverage: { score: number; max: number; label: string }
  value: { score: number; max: number; label: string }
}

type CategorySpend = { name: string; amount: number; percent: number; toolCount: number }
type AnnualSaving = { toolName: string; toolSlug: string; monthlyPrice: number; annualMonthly: number; savingsPerYear: number }
type AlsoUse = { name: string; slug: string; logo_url: string | null; pairCount: number; totalUsers: number; percent: number }
type TeamCost = { size: number; monthly: number; yearly: number }

type Intel = {
  score: ScoreBreakdown
  categorySpend: CategorySpend[]
  annualSavings: AnnualSaving[]
  alsoUse: AlsoUse[]
  teamCosts: TeamCost[]
}

const SCORE_COLORS: Record<string, string> = {
  bad: 'text-red-500',
  mid: 'text-amber-500',
  good: 'text-emerald-500',
}

function scoreColor(score: number): string {
  if (score >= 75) return SCORE_COLORS.good
  if (score >= 50) return SCORE_COLORS.mid
  return SCORE_COLORS.bad
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Great'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs work'
}

const BAR_COLORS = ['bg-primary', 'bg-amber-500', 'bg-emerald-500', 'bg-violet-500', 'bg-blue-500', 'bg-rose-500', 'bg-cyan-500']

export function StackIntel() {
  const [intel, setIntel] = useState<Intel | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)
  const [teamSize, setTeamSize] = useState(1)

  useEffect(() => {
    fetch('/api/tracker/stack-intel')
      .then(r => r.json())
      .then(d => { setIntel(d.intel || null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl border border-foreground/[0.06] p-6 text-center">
        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">Crunching your stack data...</p>
      </div>
    )
  }

  if (!intel) return null

  const { score, categorySpend, annualSavings, alsoUse, teamCosts } = intel
  const selectedTeam = teamCosts.find(t => t.size === teamSize) || teamCosts[0]

  return (
    <div className="space-y-4">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-500" />
          Stack Intelligence
        </h3>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="space-y-5">

          {/* ═══ Stack Health Score ═══ */}
          <div className="rounded-2xl border border-foreground/[0.06] p-5">
            <div className="flex items-center gap-5 mb-4">
              <div className="relative h-20 w-20 shrink-0">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-foreground/[0.06]" />
                  <circle
                    cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
                    strokeDasharray={`${score.total} ${100 - score.total}`}
                    strokeLinecap="round"
                    className={scoreColor(score.total)}
                    stroke="currentColor"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-xl font-black ${scoreColor(score.total)}`}>{score.total}</span>
                  <span className="text-[8px] text-muted-foreground font-semibold uppercase tracking-wider">/100</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-lg font-black">{scoreLabel(score.total)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Stack Health Score</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'efficiency', title: 'Efficiency', ...score.efficiency },
                { key: 'quality', title: 'Quality', ...score.quality },
                { key: 'coverage', title: 'Coverage', ...score.coverage },
                { key: 'value', title: 'Value', ...score.value },
              ].map(dim => (
                <div key={dim.key} className="rounded-lg bg-foreground/[0.02] p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground">{dim.title}</span>
                    <span className="text-[10px] font-bold">{dim.score}/{dim.max}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${dim.score >= dim.max * 0.75 ? 'bg-emerald-500' : dim.score >= dim.max * 0.5 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${(dim.score / dim.max) * 100}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1">{dim.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ Category Spend Breakdown ═══ */}
          {categorySpend.length > 0 && (
            <div className="rounded-xl border border-foreground/[0.06] p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Where your money goes</span>
              </div>

              {/* Stacked bar */}
              <div className="h-3 rounded-full overflow-hidden flex mb-3">
                {categorySpend.map((cat, i) => (
                  <div
                    key={cat.name}
                    className={`${BAR_COLORS[i % BAR_COLORS.length]} transition-all`}
                    style={{ width: `${Math.max(cat.percent, 2)}%` }}
                    title={`${cat.name}: ${cat.percent}%`}
                  />
                ))}
              </div>

              <div className="space-y-1.5">
                {categorySpend.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-2 text-xs">
                    <div className={`h-2.5 w-2.5 rounded-sm shrink-0 ${BAR_COLORS[i % BAR_COLORS.length]}`} />
                    <span className="font-medium flex-1">{cat.name}</span>
                    <span className="text-muted-foreground">{cat.toolCount} tool{cat.toolCount > 1 ? 's' : ''}</span>
                    <span className="font-bold w-16 text-right">${cat.amount}/mo</span>
                    <span className="text-muted-foreground w-10 text-right">{cat.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Annual Billing Savings ═══ */}
          {annualSavings.length > 0 && (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.03] p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Switch to annual billing</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Save by paying yearly instead of monthly. No changes to your stack.
              </p>
              {annualSavings.map((saving, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-emerald-400/10 last:border-0">
                  <span className="text-sm font-medium flex-1">{saving.toolName}</span>
                  <span className="text-xs text-muted-foreground line-through">${saving.monthlyPrice}/mo</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">${saving.annualMonthly}/mo</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">-${saving.savingsPerYear}/yr</span>
                </div>
              ))}
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 text-right">
                Total: -${annualSavings.reduce((s, a) => s + a.savingsPerYear, 0)}/yr
              </p>
            </div>
          )}

          {/* ═══ People Also Use ═══ */}
          {alsoUse.length > 0 && (
            <div className="rounded-xl border border-foreground/[0.06] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Users like you also use</span>
              </div>
              <div className="space-y-2">
                {alsoUse.map((tool, i) => (
                  <Link
                    key={i}
                    href={`/tools/${tool.slug}`}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                      {tool.logo_url ? (
                        <img src={tool.logo_url} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{tool.name[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold group-hover:text-primary transition-colors truncate">{tool.name}</p>
                      <p className="text-[10px] text-muted-foreground">{tool.percent}% of similar users</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Team Cost Multiplier ═══ */}
          <div className="rounded-xl border border-foreground/[0.06] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Team cost projection</span>
            </div>
            <div className="flex gap-1.5 mb-3">
              {teamCosts.map(tc => (
                <button
                  key={tc.size}
                  onClick={() => setTeamSize(tc.size)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    teamSize === tc.size
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'border border-foreground/[0.06] text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tc.size === 1 ? 'Solo' : `${tc.size} people`}
                </button>
              ))}
            </div>
            <div className="text-center">
              <p className="text-2xl font-black">${selectedTeam.monthly.toLocaleString()}<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
              <p className="text-sm text-muted-foreground">${selectedTeam.yearly.toLocaleString()}/year for {teamSize === 1 ? 'you' : `a team of ${teamSize}`}</p>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
