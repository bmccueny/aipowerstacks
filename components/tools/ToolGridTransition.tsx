'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ToolCardSkeleton } from './ToolCardSkeleton'

interface ToolGridTransitionProps {
  children: React.ReactNode
  view?: 'grid' | 'list'
}

/**
 * Wraps the server-rendered ToolGrid and shows a skeleton overlay
 * while search params are changing (i.e. during server re-renders).
 *
 * Detects transitions by comparing the current searchParams string
 * to the one present when children last rendered.
 */
export function ToolGridTransition({ children, view = 'grid' }: ToolGridTransitionProps) {
  const searchParams = useSearchParams()
  const paramsString = searchParams.toString()

  // Track the params that correspond to the currently rendered children
  const renderedParams = useRef(paramsString)
  const [isPending, setIsPending] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    // When params change, show skeleton
    if (paramsString !== renderedParams.current) {
      setIsPending(true)

      // Safety timeout: if server takes too long, hide skeleton after 8s
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setIsPending(false), 8000)
    }
  }, [paramsString])

  useEffect(() => {
    // When children re-render (new server data arrived), hide skeleton
    renderedParams.current = paramsString
    setIsPending(false)
    clearTimeout(timeoutRef.current)
  }, [children, paramsString])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  if (isPending) {
    return (
      <div className="relative">
        {/* Skeleton overlay */}
        <div
          className={
            view === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'flex flex-col gap-2'
          }
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <ToolCardSkeleton key={i} view={view} />
          ))}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
