'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

type StackItem = {
  id: string
  reason: string
  monthly_cost: number
  role_in_stack: string
  tool: { id: string; name: string; slug: string; tagline: string; logo_url: string | null; pricing_model: string; avg_rating: number } | null
}

type AdvisorResult = {
  stack: StackItem[]
  total_monthly: number
  savings_tip: string
  summary: string
  budget: number
  role: string
}

const ROLES = [
  'Software Developer',
  'Content Creator',
  'Marketing Manager',
  'Product Designer',
  'Data Analyst',
  'Startup Founder',
  'Freelancer',
  'Student',
  'Researcher',
  'Sales Professional',
]

const PRIORITIES = [
  'Privacy & security',
  'Team collaboration',
  'API access',
  'Open source',
  'Mobile apps',
  'Integrations',
]

export function StackAdvisorClient() {
  const [role, setRole] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [budget, setBudget] = useState(50)
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AdvisorResult | null>(null)
  const [error, setError] = useState('')

  const togglePriority = (p: string) => {
    setSelectedPriorities(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  const handleSubmit = async () => {
    const finalRole = role === 'custom' ? customRole : role
    if (!finalRole) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/stack-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: finalRole, budget, priorities: selectedPriorities }),
      })
      if (!res.ok) throw new Error('Failed to get recommendation')
      const data = await res.json()
      setResult(data)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div>
        {/* Summary */}
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-6 mb-6">
          <div className="flex items-start gap-3 mb-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-foreground">Your recommended stack</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{result.summary}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-primary/10">
            <div>
              <p className="text-2xl font-black tabular-nums">${result.total_monthly}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">per month</p>
            </div>
            <div className="text-xs text-muted-foreground">
              Budget: ${result.budget}/mo — <span className="text-emerald-600 font-medium">${result.budget - result.total_monthly} remaining</span>
            </div>
          </div>
        </div>

        {/* Stack */}
        <div className="space-y-3 mb-6">
          {result.stack.map((item, i) => (
            <div key={item.id || i} className="rounded-xl border border-border bg-white dark:bg-card p-4 flex items-start gap-4">
              <div className="shrink-0">
                {item.tool?.logo_url ? (
                  <img src={item.tool.logo_url} alt={item.tool.name} className="w-10 h-10 rounded-lg object-contain" />
                ) : (
                  <span className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {item.tool?.name?.[0] ?? '?'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Link href={`/tools/${item.tool?.slug ?? ''}`} className="font-bold text-sm hover:text-primary transition-colors">
                    {item.tool?.name ?? 'Unknown'}
                  </Link>
                  <span className="text-xs font-bold tabular-nums text-muted-foreground">
                    {item.monthly_cost === 0 ? 'Free' : `$${item.monthly_cost}/mo`}
                  </span>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/80 mb-1">{item.role_in_stack}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.reason}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Savings tip */}
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-4 mb-8">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{result.savings_tip}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Link href={`/tracker?import=${result.stack.map(s => `${s.tool?.slug ?? ''}:${s.monthly_cost}`).join(',')}`}>
            <Button className="font-bold gap-2 h-11 px-6">
              Track This Stack <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setResult(null)} className="font-bold h-11 px-6">
            Try Different Budget
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Role selection */}
      <div>
        <label className="text-sm font-semibold text-foreground block mb-3">What&apos;s your role?</label>
        <div className="flex flex-wrap gap-2">
          {ROLES.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); setCustomRole('') }}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all border ${
                role === r
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground'
              }`}
            >
              {r}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setRole('custom')}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all border ${
              role === 'custom'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground'
            }`}
          >
            Other...
          </button>
        </div>
        {role === 'custom' && (
          <input
            type="text"
            placeholder="Describe your role..."
            value={customRole}
            onChange={e => setCustomRole(e.target.value)}
            className="mt-3 w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        )}
      </div>

      {/* Budget slider */}
      <div>
        <label className="text-sm font-semibold text-foreground block mb-3">
          Monthly budget: <span className="text-primary font-black">${budget}</span>
        </label>
        <input
          type="range"
          min={0}
          max={300}
          step={10}
          value={budget}
          onChange={e => setBudget(Number(e.target.value))}
          className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>$0 (free only)</span>
          <span>$150</span>
          <span>$300+</span>
        </div>
      </div>

      {/* Priorities */}
      <div>
        <label className="text-sm font-semibold text-foreground block mb-3">Priorities <span className="font-normal text-muted-foreground">(optional)</span></label>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => togglePriority(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                selectedPriorities.includes(p)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-foreground/20'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div>
        <Button
          onClick={handleSubmit}
          disabled={loading || (!role || (role === 'custom' && !customRole))}
          className="font-bold gap-2 h-12 px-8 text-base w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Building your stack...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Get My Stack
            </>
          )}
        </Button>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      </div>
    </div>
  )
}
