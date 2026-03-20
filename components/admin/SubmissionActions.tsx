'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface SubmissionActionsProps {
  submissionId: string
  submission: {
    name: string
    website_url: string
    tagline: string
    description: string
    pricing_model: string | null
    category_id: string | null
  }
}

export function SubmissionActions({ submissionId, submission }: SubmissionActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  const handleApprove = async () => {
    setLoading('approve')
    await fetch(`/api/admin/submissions/${submissionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', submission }),
    })
    setLoading(null)
    router.refresh()
  }

  const handleReject = async () => {
    setLoading('reject')
    await fetch(`/api/admin/submissions/${submissionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', rejection_reason: rejectReason }),
    })
    setLoading(null)
    setShowReject(false)
    router.refresh()
  }

  if (showReject) {
    return (
      <div className="flex flex-col gap-2 min-w-[200px]">
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Rejection reason (optional)"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs resize-none h-20 focus:outline-none focus-visible:border-primary/50"
        />
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={handleReject} disabled={loading === 'reject'} className="flex-1">
            {loading === 'reject' ? '...' : 'Confirm Reject'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowReject(false)}>Cancel</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={!!loading}
        className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
        variant="outline"
      >
        {loading === 'approve' ? '...' : 'Approve'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowReject(true)}
        disabled={!!loading}
        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
      >
        Reject
      </Button>
    </div>
  )
}
