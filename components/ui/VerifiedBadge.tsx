import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

type BadgeSize = 'xs' | 'sm' | 'md' | 'lg'

const iconSizes: Record<BadgeSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-4.5 w-4.5',
}

/**
 * VerifiedBadge — matches the hero's "Editorially Verified" glass aesthetic.
 *
 *   icon-only  (default) — ShieldCheck in text-primary, used inline next to names
 *   showLabel            — glass pill with icon + text, mirrors the hero cards
 */
export function VerifiedBadge({
  size = 'sm',
  showLabel = false,
  label = 'Verified',
  className,
}: {
  size?: BadgeSize
  showLabel?: boolean
  label?: string
  className?: string
}) {
  if (showLabel) {
    return (
      <span
        className={cn(
          'glass',
          'inline-flex items-center gap-1.5 rounded-full whitespace-nowrap',
          'px-2.5 py-[3px]',
          'shadow-[0_4px_10px_-2px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_10px_-2px_rgba(0,0,0,0.4)]',
          className
        )}
      >
        <ShieldCheck className={cn(iconSizes[size], 'text-primary shrink-0 fill-primary/10')} />
        <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none">
          {label}
        </span>
      </span>
    )
  }

  return (
    <ShieldCheck
      className={cn(iconSizes[size], 'shrink-0 text-primary fill-primary/10', className)}
    />
  )
}
