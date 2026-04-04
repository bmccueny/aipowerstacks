'use client'

import { useState, useEffect, useCallback } from 'react'
import { DollarSign, AlertTriangle, Target, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const ANON_BUDGET_KEY = 'aips_tracker_budget'

type BudgetBarProps = {
  totalSpend: number
  isLoggedIn?: boolean
}

export function BudgetBar({ totalSpend, isLoggedIn = true }: BudgetBarProps) {
  const [budget, setBudget] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      try {
        const stored = localStorage.getItem(ANON_BUDGET_KEY)
        if (stored) {
          const val = parseFloat(stored)
          if (!isNaN(val) && val > 0) {
            setBudget(val)
            setInputValue(String(val))
          }
        }
      } catch { /* localStorage unavailable */ }
      setLoading(false)
      return
    }

    fetch('/api/tracker/budget')
      .then(r => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then(d => {
        setBudget(d.monthly_budget)
        if (d.monthly_budget) setInputValue(String(d.monthly_budget))
      })
      .catch(() => { /* not logged in or failed */ })
      .finally(() => setLoading(false))
  }, [isLoggedIn])

  // Trigger animation after mount
  useEffect(() => {
    if (budget && !loading) {
      const timer = setTimeout(() => setAnimated(true), 100)
      return () => clearTimeout(timer)
    }
  }, [budget, loading])

  const saveBudget = useCallback(async () => {
    const value = parseFloat(inputValue)
    if (isNaN(value) || value <= 0) {
      toast.error('Enter a valid budget amount')
      return
    }
    setSaving(true)

    if (!isLoggedIn) {
      try { localStorage.setItem(ANON_BUDGET_KEY, String(value)) } catch { /* noop */ }
      setBudget(value)
      setEditing(false)
      setAnimated(false)
      setTimeout(() => setAnimated(true), 100)
      toast.success('Budget set!')
      setSaving(false)
      return
    }

    const res = await fetch('/api/tracker/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthly_budget: value }),
    })
    if (res.ok) {
      setBudget(value)
      setEditing(false)
      setAnimated(false)
      setTimeout(() => setAnimated(true), 100)
      toast.success('Budget set!')
    } else {
      toast.error('Failed to save budget')
    }
    setSaving(false)
  }, [inputValue, isLoggedIn])

  const clearBudget = useCallback(async () => {
    setSaving(true)

    if (!isLoggedIn) {
      try { localStorage.removeItem(ANON_BUDGET_KEY) } catch { /* noop */ }
      setBudget(null)
      setInputValue('')
      setEditing(false)
      toast.success('Budget cleared')
      setSaving(false)
      return
    }

    const res = await fetch('/api/tracker/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthly_budget: null }),
    })
    if (res.ok) {
      setBudget(null)
      setInputValue('')
      setEditing(false)
      toast.success('Budget cleared')
    }
    setSaving(false)
  }, [isLoggedIn])

  if (loading) return null

  // No budget set — show prompt
  if (budget === null && !editing) {
    return (
      <div className="rounded-xl border border-foreground/[0.06] p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4" />
          <span>Set a monthly budget to track your AI spending</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditing(true)}
          className="shrink-0"
        >
          Set Budget
        </Button>
      </div>
    )
  }

  // Editing mode
  if (editing) {
    return (
      <div className="rounded-xl border border-foreground/[0.06] p-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Monthly Budget</span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-muted-foreground">$</span>
          <Input
            type="number"
            min="1"
            step="1"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="100"
            className="w-28"
            onKeyDown={e => e.key === 'Enter' && saveBudget()}
            autoFocus
          />
          <Button size="sm" onClick={saveBudget} disabled={saving}>
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(false)
              if (budget) setInputValue(String(budget))
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
          {budget !== null && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive ml-auto text-xs"
              onClick={clearBudget}
              disabled={saving}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Budget display
  const percentage = budget ? Math.min((totalSpend / budget) * 100, 100) : 0
  const overBudget = budget ? totalSpend > budget : false
  const isWarning = percentage >= 70 && percentage < 90
  const isDanger = percentage >= 90

  const barColor = isDanger
    ? 'bg-red-500'
    : isWarning
      ? 'bg-yellow-500'
      : 'bg-emerald-500'

  const bgColor = isDanger
    ? 'bg-red-500/10'
    : isWarning
      ? 'bg-yellow-500/10'
      : 'bg-emerald-500/10'

  return (
    <div className="rounded-xl border border-foreground/[0.06] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Monthly Budget</span>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Edit
        </button>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className={`h-3 rounded-full ${bgColor} overflow-hidden`}>
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`}
            style={{ width: animated ? `${percentage}%` : '0%' }}
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            ${totalSpend.toFixed(0)} / ${budget?.toFixed(0)} budget
          </span>
          <span className={`text-xs ${isDanger ? 'text-red-500 font-medium' : isWarning ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Warning banners */}
      {overBudget && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>You&apos;re ${(totalSpend - (budget ?? 0)).toFixed(0)} over budget this month</span>
        </div>
      )}
      {!overBudget && isDanger && (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Approaching your budget limit — ${((budget ?? 0) - totalSpend).toFixed(0)} remaining</span>
        </div>
      )}
    </div>
  )
}
