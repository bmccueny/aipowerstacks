'use client'

import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  hasMore: boolean
}

export function Pagination({ page, hasMore }: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const pageHref = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (p === 1) {
      params.delete('page')
    } else {
      params.set('page', String(p))
    }
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  if (page === 1 && !hasMore) return null

  const prevHref = pageHref(Math.max(1, page - 1))
  const nextHref = pageHref(page + 1)

  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      {page <= 1 ? (
        <Button
          variant="outline"
          size="sm"
          disabled
          className="border-black/25 hover:border-black/45"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="border-black/25 hover:border-black/45"
          asChild
        >
          <Link href={prevHref}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>
        </Button>
      )}
      <span className="text-sm text-muted-foreground px-2">Page {page}</span>
      {!hasMore ? (
        <Button
          variant="outline"
          size="sm"
          disabled
          className="border-black/25 hover:border-black/45"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="border-black/25 hover:border-black/45"
          asChild
        >
          <Link href={nextHref}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  )
}
