import { ToolCard } from './ToolCard'
import { ToolCardSkeleton } from './ToolCardSkeleton'
import type { ToolSearchResult } from '@/lib/types'

interface ToolGridProps {
  tools: ToolSearchResult[]
  view?: 'grid' | 'list'
  loading?: boolean
}

export function ToolGrid({ tools, view = 'grid', loading = false }: ToolGridProps) {
  if (loading) {
    return (
      <div className={view === 'grid'
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
        : 'flex flex-col gap-2'
      }>
        {Array.from({ length: 12 }).map((_, i) => (
          <ToolCardSkeleton key={i} view={view} />
        ))}
      </div>
    )
  }

  if (tools.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">No tools found.</p>
        <p className="text-muted-foreground text-sm mt-1">Try adjusting your search or filters.</p>
      </div>
    )
  }

  return (
    <div className={view === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
      : 'flex flex-col gap-2'
    }>
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} view={view} />
      ))}
    </div>
  )
}
