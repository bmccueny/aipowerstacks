'use client'

type Subscription = {
  tool_id: string
  monthly_cost: number
  created_at: string
  tools: { name: string; logo_url: string | null } | null
}

export function BillingCalendar({ subscriptions }: { subscriptions: Subscription[] }) {
  const paid = subscriptions.filter(s => Number(s.monthly_cost) > 0)
  if (paid.length === 0) return null

  // Estimate renewal dates based on created_at (day of month)
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const renewals = paid.map(s => {
    const created = new Date(s.created_at)
    const billingDay = Math.min(created.getDate(), 28) // Clamp to 28 for safety
    let renewalDate = new Date(currentYear, currentMonth, billingDay)
    if (renewalDate < now) {
      renewalDate = new Date(currentYear, currentMonth + 1, billingDay)
    }
    const daysUntil = Math.ceil((renewalDate.getTime() - now.getTime()) / 86400000)
    return {
      ...s,
      renewalDate,
      daysUntil,
      billingDay,
    }
  }).sort((a, b) => a.daysUntil - b.daysUntil)

  const totalUpcoming7d = renewals
    .filter(r => r.daysUntil <= 7)
    .reduce((s, r) => s + Number(r.monthly_cost), 0)

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Upcoming Renewals</p>
        {totalUpcoming7d > 0 && (
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">${totalUpcoming7d} this week</span>
        )}
      </div>

      {/* Calendar strip — next 30 days */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {Array.from({ length: 30 }, (_, i) => {
          const date = new Date(now)
          date.setDate(now.getDate() + i)
          const dayRenewals = renewals.filter(r => r.daysUntil === i)
          const isToday = i === 0
          const hasRenewal = dayRenewals.length > 0
          return (
            <div
              key={i}
              className={`flex flex-col items-center min-w-[32px] py-1.5 px-1 rounded-lg text-center shrink-0 ${
                hasRenewal
                  ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
                  : isToday
                    ? 'bg-primary/5 border border-primary/20'
                    : ''
              }`}
              title={dayRenewals.map(r => `${r.tools?.name}: $${Number(r.monthly_cost)}`).join(', ')}
            >
              <span className="text-[8px] text-muted-foreground uppercase">
                {date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
              </span>
              <span className={`text-[11px] font-bold ${isToday ? 'text-primary' : ''}`}>
                {date.getDate()}
              </span>
              {hasRenewal && (
                <div className="h-1 w-1 rounded-full bg-amber-500 mt-0.5" />
              )}
            </div>
          )
        })}
      </div>

      {/* Next 3 renewals */}
      <div className="space-y-1.5">
        {renewals.slice(0, 3).map(r => (
          <div key={r.tool_id} className="flex items-center gap-2 text-xs">
            <span className={`font-bold shrink-0 ${r.daysUntil <= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
              {r.daysUntil === 0 ? 'Today' : r.daysUntil === 1 ? 'Tomorrow' : `${r.daysUntil}d`}
            </span>
            <span className="font-medium flex-1 truncate">{r.tools?.name || '?'}</span>
            <span className="font-bold">${Number(r.monthly_cost)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
