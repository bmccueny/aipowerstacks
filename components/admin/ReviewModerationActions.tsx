'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type ReviewStatus = 'draft' | 'pending' | 'published'

export function ReviewModerationActions({
  reviewId,
  currentStatus,
}: {
  reviewId: string
  currentStatus: ReviewStatus
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const updateStatus = async (status: ReviewStatus) => {
    setLoading(true)
    const rejectionReason = status === 'draft' ? 'Needs revision before publishing' : undefined
    const res = await fetch(`/api/admin/reviews/${reviewId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejectionReason }),
    })

    setLoading(false)
    if (!res.ok) return
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      {currentStatus !== 'published' && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => updateStatus('published')}
          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
        >
          Publish
        </Button>
      )}
      {currentStatus !== 'pending' && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => updateStatus('pending')}
          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
        >
          Mark Pending
        </Button>
      )}
      {currentStatus !== 'draft' && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => updateStatus('draft')}
          className="border-white/20 text-muted-foreground hover:bg-white/5"
        >
          Send to Draft
        </Button>
      )}
    </div>
  )
}
