'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, RefreshCw } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin error:', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center px-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Admin Error</h2>
        <p className="text-muted-foreground max-w-md">
          Something went wrong in the admin panel. Try again or return to the dashboard.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono">Error: {error.digest}</p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/admin">
            <LayoutDashboard className="h-4 w-4" />
            Admin Dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
