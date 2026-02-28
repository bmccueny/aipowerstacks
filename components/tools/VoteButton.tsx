'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const keyForTool = (toolId: string) => `tool_vote_${toolId}`

export function VoteButton({
  toolId,
  initialCount,
  className,
}: {
  toolId: string
  initialCount: number
  className?: string
}) {
  const [count, setCount] = useState(initialCount)
  const [voted, setVoted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const celebrateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setCount(initialCount)
  }, [initialCount])

  useEffect(() => {
    try {
      setVoted(window.localStorage.getItem(keyForTool(toolId)) === '1')
    } catch {
      setVoted(false)
    }
  }, [toolId])

  useEffect(() => {
    return () => {
      if (celebrateTimeoutRef.current) clearTimeout(celebrateTimeoutRef.current)
    }
  }, [])

  const vote = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (voted || loading) return

    setLoading(true)
    const res = await fetch(`/api/tools/${toolId}/vote`, { method: 'POST' })
    const data = await res.json().catch(() => null)
    setLoading(false)

    if (!res.ok) return

    setVoted(true)
    if (typeof data?.upvoteCount === 'number') {
      setCount(data.upvoteCount)
    } else {
      setCount((prev) => prev + 1)
    }
    setCelebrate(true)
    if (celebrateTimeoutRef.current) clearTimeout(celebrateTimeoutRef.current)
    celebrateTimeoutRef.current = setTimeout(() => setCelebrate(false), 700)

    try {
      window.localStorage.setItem(keyForTool(toolId), '1')
    } catch {
      // Ignore localStorage errors.
    }
  }

  return (
    <button
      type="button"
      onClick={vote}
      disabled={loading}
      aria-label={voted ? 'Already upvoted' : 'Upvote tool'}
      className={cn(
        'relative inline-flex items-center gap-1 rounded-full border border-foreground bg-background px-2.5 py-1 text-[11px] font-semibold shadow-[var(--aix-vote-shadow)] transition-all disabled:cursor-not-allowed disabled:opacity-70',
        voted
          ? 'bg-primary/20 text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[var(--aix-vote-hover-shadow)]',
        className
      )}
    >
      {celebrate ? (
        <>
          <span className="pointer-events-none absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/70 animate-vote-ring" />
          <span className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-primary animate-vote-float">
            +1
          </span>
        </>
      ) : null}
      <ArrowUp className={cn('h-3.5 w-3.5', voted ? 'text-primary' : '', celebrate ? 'animate-vote-pop' : '')} />
      <span>{count}</span>
    </button>
  )
}
