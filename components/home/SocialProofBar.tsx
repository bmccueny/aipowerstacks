'use client'

import { AnimatedCounter } from '@/components/common/AnimatedCounter'

interface SocialProofBarProps {
  toolCount: number
  categoryCount: number
}

export function SocialProofBar({ toolCount, categoryCount }: SocialProofBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm sm:text-base text-muted-foreground/70">
      <span className="flex items-center gap-1.5">
        <AnimatedCounter
          target={toolCount}
          suffix="+"
          className="font-bold text-foreground tabular-nums"
        />
        <span>AI Tools</span>
      </span>
      <span className="text-muted-foreground/30" aria-hidden="true">·</span>
      <span className="flex items-center gap-1.5">
        <AnimatedCounter
          target={categoryCount}
          suffix="+"
          className="font-bold text-foreground tabular-nums"
        />
        <span>Categories</span>
      </span>
      <span className="text-muted-foreground/30" aria-hidden="true">·</span>
      <span className="font-medium">Updated Daily</span>
    </div>
  )
}
