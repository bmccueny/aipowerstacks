'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import type { Category } from '@/lib/types'
import { INTEGRATION_OPTIONS, PRICING_MODELS, SORT_OPTIONS, TEAM_SIZE_OPTIONS, USE_CASE_OPTIONS } from '@/lib/constants'

interface ToolFiltersProps {
  categories: Category[]
}

export function ToolFilters({ categories }: ToolFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showMore, setShowMore] = useState(false)

  const category = searchParams.get('category') ?? ''
  const pricing = searchParams.get('pricing') ?? ''
  const useCase = searchParams.get('use_case') ?? ''
  const teamSize = searchParams.get('team_size') ?? ''
  const integration = searchParams.get('integration') ?? ''
  const sort = searchParams.get('sort') ?? 'relevance'

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearAll = () => {
    router.push(pathname)
  }

  const activeFilters = [
    category && { key: 'category', value: category, label: `Category: ${category}` },
    pricing && { key: 'pricing', value: pricing, label: `Pricing: ${pricing}` },
    useCase && { key: 'use_case', value: useCase, label: `Use case: ${useCase}` },
    teamSize && { key: 'team_size', value: teamSize, label: `Team size: ${teamSize}` },
    integration && { key: 'integration', value: integration, label: `Integration: ${integration}` },
  ].filter(Boolean) as { key: string; value: string; label: string }[]

  const hasSecondaryActive = !!(useCase || teamSize || integration)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Select value={category || 'all'} onValueChange={(v) => updateParam('category', v)}>
          <SelectTrigger className="w-44 bg-background border-foreground/20">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={pricing || 'all'} onValueChange={(v) => updateParam('pricing', v)}>
          <SelectTrigger className="w-36 bg-background border-foreground/20">
            <SelectValue placeholder="All Pricing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pricing</SelectItem>
            {PRICING_MODELS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => updateParam('sort', v)}>
          <SelectTrigger className="w-36 bg-background border-foreground/20">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border border-foreground/20 bg-background hover:bg-foreground/5 transition-colors"
        >
          {showMore ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          More filters
          {hasSecondaryActive && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-primary" />}
        </button>
      </div>

      {showMore && (
        <div className="flex flex-wrap gap-2">
          <Select value={useCase || 'all'} onValueChange={(v) => updateParam('use_case', v)}>
            <SelectTrigger className="w-40 bg-background border-foreground/20">
              <SelectValue placeholder="Use Case" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Use Cases</SelectItem>
              {USE_CASE_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={teamSize || 'all'} onValueChange={(v) => updateParam('team_size', v)}>
            <SelectTrigger className="w-44 bg-background border-foreground/20">
              <SelectValue placeholder="Team Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Team Sizes</SelectItem>
              {TEAM_SIZE_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={integration || 'all'} onValueChange={(v) => updateParam('integration', v)}>
            <SelectTrigger className="w-40 bg-background border-foreground/20">
              <SelectValue placeholder="Integration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Integrations</SelectItem>
              {INTEGRATION_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="gap-1.5 cursor-pointer hover:bg-destructive/20 transition-colors"
              onClick={() => updateParam(filter.key, '')}
            >
              {filter.label}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
