import Link from 'next/link'
import Image from 'next/image'
import { Star, ExternalLink, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ToolSearchResult } from '@/lib/types'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'

interface ToolCardProps {
  tool: ToolSearchResult
  view?: 'grid' | 'list'
}

export function ToolCard({ tool, view = 'grid' }: ToolCardProps) {
  const pricingColor = PRICING_BADGE_COLORS[tool.pricing_model] ?? PRICING_BADGE_COLORS.unknown
  const pricingLabel = PRICING_LABELS[tool.pricing_model] ?? 'Unknown'

  if (view === 'list') {
    return (
      <Link href={`/tools/${tool.slug}`} className="block">
        <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-4 hover:border-primary/30 transition-colors group">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-white/10 overflow-hidden flex items-center justify-center">
            {tool.logo_url ? (
              <Image src={tool.logo_url} alt={tool.name} width={40} height={40} className="object-cover" />
            ) : (
              <span className="text-lg font-bold text-primary">{tool.name[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm group-hover:text-primary transition-colors truncate">{tool.name}</span>
              {tool.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">{tool.tagline}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {tool.avg_rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-xs text-muted-foreground">{tool.avg_rating.toFixed(1)}</span>
              </div>
            )}
            <Badge variant="outline" className={`text-xs ${pricingColor}`}>{pricingLabel}</Badge>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/tools/${tool.slug}`} className="block group">
      <div className="glass-card rounded-xl p-4 h-full flex flex-col gap-3 hover:border-primary/30 transition-colors">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 shrink-0 rounded-xl bg-white/10 overflow-hidden flex items-center justify-center">
            {tool.logo_url ? (
              <Image src={tool.logo_url} alt={tool.name} width={44} height={44} className="object-cover" />
            ) : (
              <span className="text-xl font-bold text-primary">{tool.name[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm group-hover:text-primary transition-colors">{tool.name}</span>
              {tool.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
              {tool.is_featured && (
                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">Featured</Badge>
              )}
            </div>
            <Badge variant="outline" className={`mt-1 text-xs ${pricingColor}`}>{pricingLabel}</Badge>
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{tool.tagline}</p>

        <div className="flex items-center justify-between mt-auto">
          {tool.avg_rating > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-muted-foreground">{tool.avg_rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({tool.review_count})</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">No reviews yet</span>
          )}
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  )
}
