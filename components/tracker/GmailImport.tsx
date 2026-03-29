'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Mail, ScanLine, Check, AlertCircle, Unlink } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { DetectedSubscription } from '@/app/api/tracker/gmail-scan/route'

type GmailStatus = 'loading' | 'not_connected' | 'connected'

type Props = {
  onImported: () => void
}

export function GmailImport({ onImported }: Props) {
  const [status, setStatus] = useState<GmailStatus>('loading')
  const [scanning, setScanning] = useState(false)
  const [detected, setDetected] = useState<DetectedSubscription[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [importing, setImporting] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()

  // Handle OAuth redirect result (?gmail=connected | ?gmail=error)
  useEffect(() => {
    const result = searchParams.get('gmail')
    if (!result) return
    if (result === 'connected') {
      toast.success('Gmail connected successfully')
      setStatus('connected')
    } else if (result === 'error') {
      toast.error('Failed to connect Gmail. Please try again.')
    }
    // Remove the query param without a full navigation
    const params = new URLSearchParams(searchParams.toString())
    params.delete('gmail')
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  // Check connection status on mount
  useEffect(() => {
    fetch('/api/tracker/gmail-scan')
      .then(r => r.json())
      .then((d: { connected: boolean }) => setStatus(d.connected ? 'connected' : 'not_connected'))
      .catch(() => setStatus('not_connected'))
  }, [])

  const handleConnect = useCallback(() => {
    window.location.href = '/api/auth/gmail?connect=1'
  }, [])

  const handleDisconnect = useCallback(async () => {
    await fetch('/api/auth/gmail', { method: 'DELETE' })
    setStatus('not_connected')
    setDetected([])
    setSelected(new Set())
    toast.success('Gmail disconnected')
  }, [])

  const handleScan = useCallback(async () => {
    setScanning(true)
    setDetected([])
    setSelected(new Set())
    try {
      const res = await fetch('/api/tracker/gmail-scan', { method: 'POST' })
      const data = await res.json() as { detected?: DetectedSubscription[]; error?: string; connected?: boolean }

      if (!res.ok) {
        if (data.connected === false) setStatus('not_connected')
        toast.error(data.error ?? 'Scan failed. Please try again.')
        return
      }

      const results = data.detected ?? []
      setDetected(results)
      // Pre-select all matched tools (those with a known tool_id)
      setSelected(new Set(results.map((_, i) => i).filter(i => results[i].tool_id != null)))

      if (results.length === 0) {
        toast.success('Scan complete — no billing emails found.')
      } else {
        toast.success(`Found ${results.length} subscription${results.length !== 1 ? 's' : ''} in Gmail`)
      }
    } catch {
      toast.error('Scan failed. Please try again.')
    } finally {
      setScanning(false)
    }
  }, [])

  const toggleSelected = useCallback((index: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  const handleImport = useCallback(async () => {
    const toImport = [...selected].map(i => detected[i]).filter(d => d.tool_id != null)
    if (toImport.length === 0) return

    setImporting(true)
    const results = await Promise.allSettled(
      toImport.map(d =>
        fetch('/api/tracker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool_id: d.tool_id, monthly_cost: d.amount }),
        }).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r }),
      ),
    )

    const succeeded = results.filter(r => r.status === 'fulfilled').length
    if (succeeded === toImport.length) {
      toast.success(`Added ${succeeded} subscription${succeeded !== 1 ? 's' : ''} to your tracker`)
    } else if (succeeded > 0) {
      toast.success(`Added ${succeeded} of ${toImport.length} subscriptions`)
    } else {
      toast.error('Failed to import subscriptions')
    }

    if (succeeded > 0) {
      setDetected([])
      setSelected(new Set())
      onImported()
    }
    setImporting(false)
  }, [selected, detected, onImported])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (status === 'loading') return null

  if (status === 'not_connected') {
    return (
      <div className="glass-card rounded-xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Import from Gmail</p>
            <p className="text-xs text-muted-foreground">Auto-detect AI subscriptions from billing emails</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handleConnect} className="shrink-0">
          Connect Gmail
        </Button>
      </div>
    )
  }

  // Connected state
  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
            <Mail className="h-4 w-4 text-green-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Gmail connected</p>
            <p className="text-xs text-muted-foreground">Scan billing emails to detect subscriptions</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDisconnect}
            className="text-muted-foreground hover:text-foreground"
          >
            <Unlink className="h-3 w-3 mr-1" />
            Disconnect
          </Button>
          <Button size="sm" onClick={handleScan} disabled={scanning}>
            {scanning
              ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Scanning…</>
              : <><ScanLine className="h-3 w-3 mr-1" /> Scan</>
            }
          </Button>
        </div>
      </div>

      {/* Results */}
      {detected.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Detected subscriptions — select to import
          </p>
          <div className="space-y-2">
            {detected.map((sub, i) => (
              <label
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  selected.has(i)
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border hover:border-border/80 hover:bg-muted/40'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selected.has(i)}
                  onChange={() => toggleSelected(i)}
                />
                {/* Checkmark */}
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  selected.has(i) ? 'bg-primary border-primary' : 'border-border'
                }`}>
                  {selected.has(i) && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>

                {/* Tool logo */}
                {sub.logo_url ? (
                  <Image
                    src={sub.logo_url}
                    alt={sub.tool_name}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-lg object-contain shrink-0"
                    unoptimized
                  />
                ) : (
                  <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                    {sub.tool_name[0]?.toUpperCase()}
                  </span>
                )}

                {/* Tool info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{sub.tool_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{sub.email_from}</p>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">${sub.amount}</p>
                  <p className="text-[10px] text-muted-foreground">/mo</p>
                </div>

                {/* Unmatched warning */}
                {!sub.tool_id && (
                  <div title="Not matched to a tool in our database" className="shrink-0">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  </div>
                )}
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              {selected.size} of {detected.length} selected
              {detected.some(d => !d.tool_id) && (
                <span className="ml-2 text-amber-500">
                  · <AlertCircle className="inline h-3 w-3" /> unmatched items won&apos;t be imported
                </span>
              )}
            </p>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={importing || selected.size === 0 || [...selected].every(i => !detected[i]?.tool_id)}
            >
              {importing
                ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Importing…</>
                : `Import ${[...selected].filter(i => detected[i]?.tool_id).length > 0
                    ? `${[...selected].filter(i => detected[i]?.tool_id).length} selected`
                    : 'selected'}`
              }
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
