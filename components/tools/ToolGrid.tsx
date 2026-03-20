import { SearchX } from 'lucide-react'
import { ToolCard } from './ToolCard'
import { ToolCardSkeleton } from './ToolCardSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import type { ToolSearchResult } from '@/lib/types'

interface ToolGridProps {
  tools: ToolSearchResult[]
  view?: 'grid' | 'list'
  loading?: boolean
  cardStyle?: 'default' | 'home'
}

export function ToolGrid({ tools, view = 'grid', loading = false, cardStyle = 'default' }: ToolGridProps) {
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
      <EmptyState
        icon={SearchX}
        title="No tools found"
        description="Try adjusting your search or filters."
        action={{ label: 'Submit a tool', href: '/submit' }}
      />
    )
  }

  return (
    <div className={view === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
      : 'flex flex-col gap-2'
    }>
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} view={view} cardStyle={cardStyle} />
      ))}
    </div>
  )
}
