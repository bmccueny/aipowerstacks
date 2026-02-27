'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import type { Category } from '@/lib/types'
import { PRICING_MODELS, SORT_OPTIONS } from '@/lib/constants'

interface ToolFiltersProps {
  categories: Category[]
}

export function ToolFilters({ categories }: ToolFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const category = searchParams.get('category') ?? ''
  const pricing = searchParams.get('pricing') ?? ''
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

  const activeFilters = [
    category && { key: 'category', value: category, label: `Category: ${category}` },
    pricing && { key: 'pricing', value: pricing, label: `Pricing: ${pricing}` },
  ].filter(Boolean) as { key: string; value: string; label: string }[]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Select value={category || 'all'} onValueChange={(v) => updateParam('category', v)}>
          <SelectTrigger className="w-44 bg-white/5 border-white/10">
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
          <SelectTrigger className="w-36 bg-white/5 border-white/10">
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
          <SelectTrigger className="w-36 bg-white/5 border-white/10">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
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
        </div>
      )}
    </div>
  )
}
