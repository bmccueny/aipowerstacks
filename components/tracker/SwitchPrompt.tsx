'use client'

import { useState } from 'react'
import { ArrowRight, Star, X } from 'lucide-react'
import { toast } from 'sonner'

type SwitchPromptProps = {
  removedToolId: string
  removedToolName: string
  recentlyAdded: Array<{ tool_id: string; name: string }>
  onClose: () => void
}

export function SwitchPrompt({ removedToolId, removedToolName, recentlyAdded, onClose }: SwitchPromptProps) {
  const [selectedTo, setSelectedTo] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [satisfaction, setSatisfaction] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  if (recentlyAdded.length === 0) return null

  const submit = async () => {
    if (!selectedTo) return
    setSubmitting(true)
    const res = await fetch('/api/tracker/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_tool_id: removedToolId,
        to_tool_id: selectedTo,
        reason: reason || null,
        satisfaction: satisfaction || null,
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      toast.success('Switch recorded — thanks for sharing!')
      onClose()
    }
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">Did you switch from {removedToolName}?</p>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Help others by sharing what you switched to. This is anonymous.</p>

      <div className="space-y-1.5">
        {recentlyAdded.map(tool => (
          <button
            key={tool.tool_id}
            onClick={() => setSelectedTo(tool.tool_id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm transition-all ${
              selectedTo === tool.tool_id
                ? 'border-primary/40 bg-primary/5 font-bold'
                : 'border-foreground/[0.06] hover:border-foreground/10'
            }`}
          >
            <ArrowRight className="h-3 w-3 text-primary shrink-0" />
            <span>Switched to {tool.name}</span>
          </button>
        ))}
      </div>

      {selectedTo && (
        <>
          <div>
            <p className="text-xs text-muted-foreground mb-1">How satisfied? (optional)</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setSatisfaction(n)}
                  className="p-1"
                >
                  <Star className={`h-5 w-5 ${n <= satisfaction ? 'fill-primary text-primary' : 'text-foreground/15'}`} />
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            placeholder="Why did you switch? (optional)"
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-foreground/[0.06] bg-background"
          />
          <button
            onClick={submit}
            disabled={submitting}
            className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Share Switch'}
          </button>
        </>
      )}
    </div>
  )
}
