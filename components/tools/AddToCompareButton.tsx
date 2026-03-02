'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeftRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCompare } from '@/lib/context/CompareContext'

export function AddToCompareButton({
  slug,
  name,
  className,
  fullWidth = false,
  compact = false,
  iconOnly = false,
}: {
  slug: string
  name: string
  className?: string
  fullWidth?: boolean
  compact?: boolean
  iconOnly?: boolean
}) {
  const { has, add, remove } = useCompare()
  const isAdded = has(slug)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isAdded) {
      remove(slug)
    } else {
      add(slug, name)
    }
  }

  if (iconOnly) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(
          'h-9 w-9 shrink-0 border-black/20',
          isAdded ? 'text-primary border-primary/40 bg-primary/5' : '',
          className
        )}
        onClick={handleClick}
        title={isAdded ? 'Remove from Compare' : 'Add to Compare'}
      >
        <ArrowLeftRight className="h-3.5 w-3.5" />
      </Button>
    )
  }

  if (compact) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          'border-black/20 gap-1.5 whitespace-nowrap',
          isAdded ? 'text-primary border-primary/40 bg-primary/5' : '',
          fullWidth ? 'w-full' : '',
          className
        )}
        onClick={handleClick}
      >
        <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" />
        {isAdded ? 'Remove' : 'Compare'}
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        'border-black/20 gap-2',
        isAdded ? 'text-primary border-primary/40 bg-primary/5' : '',
        fullWidth ? 'w-full' : '',
        className
      )}
      onClick={handleClick}
    >
      <ArrowLeftRight className="h-4 w-4 shrink-0" />
      {isAdded ? 'Remove from Compare' : 'Add to Compare'}
    </Button>
  )
}
