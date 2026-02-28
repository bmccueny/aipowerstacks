'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function HelpfulButton({
  reviewId,
  initialCount,
}: {
  reviewId: string
  initialCount: number
}) {
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleClick = async () => {
    if (done || loading) return
    setLoading(true)
    const res = await fetch(`/api/reviews/${reviewId}/helpful`, { method: 'POST' })
    setLoading(false)
    if (!res.ok) return

    setCount((c) => c + 1)
    setDone(true)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
    >
      Helpful ({count})
    </Button>
  )
}
