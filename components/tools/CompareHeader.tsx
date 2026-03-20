import Image from 'next/image'
import Link from 'next/link'
import { X, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/reviews/StarRating'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { CompareToolSearch } from './CompareToolSearch'
import type { ToolWithTags } from '@/lib/types'

interface CompareHeaderProps {
  tools: ToolWithTags[]
  slugs: string[]
  emptySlots: number
  highestRatingIdx: number
  onRemoveTool: (slug: string) => void
}

export function CompareHeader({ tools, slugs, emptySlots, highestRatingIdx, onRemoveTool }: CompareHeaderProps) {
  return (
    <thead>
      <tr className="border-b-2 border-foreground/[0.08]">
        {/* Label column header */}
        <th className={cn(
          'w-[110px] min-w-[110px] sm:w-[170px] sm:min-w-[170px]',
          'p-2 sm:p-3 text-left align-bottom',
          'border-r border-foreground/[0.06]',
          'sticky left-0 z-30 bg-background'
        )}>
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/30">Specs</span>
        </th>

        {/* Tool columns */}
        {tools.map((tool, idx) => {
          const isWinner = tools.length > 1 && idx === highestRatingIdx && tool.avg_rating > 0
          return (
            <th key={tool.id} className={cn(
              'min-w-[140px] sm:min-w-[180px]',
              'p-2.5 sm:p-4 text-center align-top relative group',
              'border-r border-foreground/[0.06] last:border-r-0',
              isWinner && 'bg-primary/[0.03]'
            )}>
              {/* Remove X */}
              <button
                onClick={() => onRemoveTool(tool.slug)}
                className="absolute top-1.5 right-1.5 h-5 w-5 sm:h-6 sm:w-6 rounded flex items-center justify-center text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all sm:opacity-0 sm:group-hover:opacity-100 z-10"
                title={`Remove ${tool.name}`}
              >
                <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </button>

              {/* Winner badge */}
              {isWinner && (
                <div className="mb-1.5 sm:mb-2">
                  <Badge className="bg-primary text-white text-[7px] sm:text-[9px] font-black uppercase tracking-wider h-4 sm:h-5 px-1.5 sm:px-2 border-none">
                    Top Rated
                  </Badge>
                </div>
              )}

              {/* Product image */}
              <Link href={`/tools/${tool.slug}`} className="block mb-2 mx-auto">
                <div className={cn(
                  'relative h-12 w-12 sm:h-16 sm:w-16 mx-auto rounded-lg sm:rounded-xl bg-white shadow-sm overflow-hidden flex items-center justify-center p-1.5 sm:p-2 border border-foreground/5 transition-transform hover:scale-105',
                  isWinner && 'ring-2 ring-primary/30'
                )}>
                  {tool.logo_url ? (
                    <Image src={tool.logo_url} alt={tool.name} fill className="object-contain" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center font-black text-primary text-lg sm:text-2xl uppercase">
                      {tool.name[0]}
                    </div>
                  )}
                </div>
              </Link>

              {/* Product name */}
              <Link href={`/tools/${tool.slug}`} className="hover:text-primary transition-colors">
                <p className="font-black text-[11px] sm:text-sm leading-tight mb-0.5 line-clamp-2">{tool.name}</p>
              </Link>

              {/* Rating */}
              {tool.review_count > 0 ? (
                <div className="flex items-center justify-center gap-0.5 mt-1">
                  <StarRating rating={tool.avg_rating} size="sm" />
                  <span className="text-[8px] sm:text-[10px] font-bold text-muted-foreground">({tool.review_count})</span>
                </div>
              ) : (
                <p className="text-[8px] sm:text-[10px] text-muted-foreground/40 font-bold mt-1">No reviews</p>
              )}

              {/* Pricing badge */}
              <div className="mt-1.5">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[8px] sm:text-[10px] font-bold uppercase h-4 sm:h-5 px-1.5 border',
                    PRICING_BADGE_COLORS[tool.pricing_model as keyof typeof PRICING_BADGE_COLORS] ?? ''
                  )}
                >
                  {PRICING_LABELS[tool.pricing_model as keyof typeof PRICING_LABELS] ?? 'Unknown'}
                </Badge>
              </div>
            </th>
          )
        })}

        {/* Empty "Add" slots */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <th key={`add-${i}`} className={cn(
            'min-w-[140px] sm:min-w-[180px]',
            'p-2.5 sm:p-4 text-center align-middle',
            'border-r border-foreground/[0.06] last:border-r-0'
          )}>
            <div className="flex flex-col items-center gap-2 py-2 sm:py-3">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg sm:rounded-xl border-2 border-dashed border-foreground/10 flex items-center justify-center">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-foreground/15" />
              </div>
              <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground/30 uppercase tracking-wider">Add Tool</p>
              {i === 0 && (
                <div className="w-full max-w-[150px]">
                  <CompareToolSearch currentSlugs={slugs} />
                </div>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  )
}
