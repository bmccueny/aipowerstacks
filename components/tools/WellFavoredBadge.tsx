import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function WellFavoredBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-amber-500/80 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 text-amber-950 text-[10px] font-bold',
        className,
      )}
    >
      <Sparkles className="h-2.5 w-2.5" />
      This one&apos;s legit
    </Badge>
  )
}
