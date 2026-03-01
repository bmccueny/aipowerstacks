'use client'

import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function WellFavoredBadge({ className, sparkle }: { className?: string; sparkle?: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'relative overflow-hidden border-amber-500/80 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 text-amber-950 text-[10px] font-bold transition-all duration-300',
        sparkle && 'animate-sparkle-once shadow-[0_0_15px_rgba(251,191,36,0.5)] scale-105',
        className,
      )}
    >
      <div className="flex items-center gap-1 relative z-10">
        <Sparkles className={cn("h-2.5 w-2.5 transition-transform duration-500", sparkle && "scale-125")} />
        <span>This one&apos;s legit</span>
      </div>
      
      {/* Sparkle Particles that only show when animated */}
      {sparkle && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-1 left-2 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '1s' }} />
          <div className="absolute bottom-1 right-4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />
          <div className="absolute top-2 right-2 w-0.5 h-0.5 bg-white rounded-full animate-pulse" />
        </div>
      )}
    </Badge>
  )
}
