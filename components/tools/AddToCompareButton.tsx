'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'compare_tool_slugs'

function readStoredSlugs() {
  if (typeof window === 'undefined') return [] as string[]
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []
  } catch {
    return []
  }
}

function writeStoredSlugs(slugs: string[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs.slice(0, 3)))
}

export function AddToCompareButton({
  slug,
  className,
  fullWidth = false,
}: {
  slug: string
  className?: string
  fullWidth?: boolean
}) {
  const router = useRouter()
  const [slugs, setSlugs] = useState<string[]>([])

  useEffect(() => {
    setSlugs(readStoredSlugs())
  }, [])

  const isAdded = slugs.includes(slug)
  const compareHref = useMemo(() => {
    const joined = slugs.join(',')
    return joined ? `/compare?tools=${encodeURIComponent(joined)}` : '/compare'
  }, [slugs])

  const add = () => {
    const next = Array.from(new Set([slug, ...slugs])).slice(0, 3)
    writeStoredSlugs(next)
    setSlugs(next)
  }

  const goToCompare = () => {
    router.push(compareHref)
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn('border-black/20', fullWidth ? 'flex-1' : '')}
        onClick={add}
        disabled={isAdded}
      >
        {isAdded ? 'Added to Compare' : 'Add to Compare'}
      </Button>
      <Button type="button" variant="ghost" size="sm" className={cn(fullWidth ? 'flex-1' : '')} onClick={goToCompare}>
        Compare ({slugs.length})
      </Button>
    </div>
  )
}
