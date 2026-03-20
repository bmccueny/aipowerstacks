'use client'

import dynamic from 'next/dynamic'
import type { ToolWithTags } from '@/lib/types'

const CompareTable = dynamic(
  () => import('@/components/tools/CompareTable').then(m => ({ default: m.CompareTable })),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-foreground/10 overflow-hidden">
        <div className="grid grid-cols-4 gap-px bg-foreground/5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-background p-6">
              <div className="h-12 w-12 rounded-xl bg-muted/50 animate-pulse mx-auto mb-3" />
              <div className="h-4 w-24 bg-muted/50 animate-pulse rounded mx-auto mb-2" />
              <div className="h-3 w-32 bg-muted/30 animate-pulse rounded mx-auto" />
            </div>
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 border-t border-foreground/5 bg-background animate-pulse" />
        ))}
      </div>
    ),
  }
)

interface CompareTableLazyProps {
  tools: ToolWithTags[]
}

export function CompareTableLazy({ tools }: CompareTableLazyProps) {
  return <CompareTable tools={tools} />
}
