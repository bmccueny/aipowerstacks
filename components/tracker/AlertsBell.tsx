'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'

type Alert = {
  id: string
  type: string
  title: string
  body: string
  severity: string
  read: boolean
  created_at: string
}

const SEVERITY_COLORS = {
  critical: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20',
  warning: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20',
  info: 'text-foreground bg-muted/50 border-foreground/10',
}

export function AlertsBell() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/tracker/alerts')
      .then(r => r.ok ? r.json() : { alerts: [] })
      .then(d => setAlerts(d.alerts || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = alerts.filter(a => !a.read).length

  const markRead = (id: string) => {
    fetch('/api/tracker/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId: id, read: true }),
    }).catch(() => {})
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
  }

  if (alerts.length === 0) return null

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-muted/60 transition-colors"
        aria-label={`${unread} unread alerts`}
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-foreground/10 bg-background shadow-lg z-50">
          <div className="p-3 border-b border-foreground/[0.06]">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alerts</p>
          </div>
          <div className="divide-y divide-foreground/[0.04]">
            {alerts.map(alert => (
              <button
                key={alert.id}
                type="button"
                onClick={() => markRead(alert.id)}
                className={`w-full text-left p-3 transition-colors hover:bg-muted/30 ${!alert.read ? 'bg-primary/[0.02]' : ''}`}
              >
                <div className="flex items-start gap-2">
                  {!alert.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold leading-tight ${!alert.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {alert.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{alert.body}</p>
                    <p className="text-[9px] text-muted-foreground/60 mt-1">
                      {new Date(alert.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
