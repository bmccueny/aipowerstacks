'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, ExternalLink, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ToolCardData } from '@/lib/types'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'
import { VoteButton } from './VoteButton'
import { WellFavoredBadge } from './WellFavoredBadge'
import { isWellFavoredTool } from '@/lib/tools/well-favored'

interface ToolCardProps {
  tool: ToolCardData
  view?: 'grid' | 'list'
  cardStyle?: 'default' | 'home'
}

export function ToolCard({ tool, view = 'grid', cardStyle = 'default' }: ToolCardProps) {
  const [imageError, setImageError] = useState(false)
  const pricingColor = PRICING_BADGE_COLORS[tool.pricing_model] ?? PRICING_BADGE_COLORS.unknown
  const pricingLabel = PRICING_LABELS[tool.pricing_model] ?? 'Unknown'
  const screenshotUrl = (tool.screenshot_urls as string[] | null)?.[0] ?? null
  const isWellFavored = isWellFavoredTool(tool)

  const renderLogo = (size: number) => {
    if (!tool.logo_url || imageError) {
      return <span className="font-black text-primary uppercase">{tool.name[0]}</span>
    }
    return (
      <img 
        src={tool.logo_url} 
        alt={tool.name} 
        width={size} 
        height={size} 
        className="object-contain" 
        onError={() => setImageError(true)}
      />
    )
  }

  if (view === 'list') {
    return (
      <Link href={`/tools/${tool.slug}`} className="block">
        <div className="glass-card card-hover rounded-[4px] px-4 py-3.5 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 group">
          <div className="h-10 w-10 shrink-0 rounded-[4px] bg-muted overflow-hidden flex items-center justify-center">
            {renderLogo(40)}
          </div>
          <div className="flex-1 min-w-[180px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[15px] group-hover:text-primary transition-colors truncate">{tool.name}</span>
              {tool.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 shrink-0" />}
            </div>
            <p className="text-[13px] leading-[1.45] text-muted-foreground truncate mt-0.5">{tool.tagline}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {isWellFavored && <WellFavoredBadge className="shrink-0" />}
              <Badge variant="outline" className={`text-[11px] ${pricingColor}`}>{pricingLabel}</Badge>
              {tool.has_api && <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">API</Badge>}
              {tool.is_open_source && <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Open Source</Badge>}
            </div>
          </div>
          <div className="w-full sm:w-auto sm:ml-auto flex items-center justify-end gap-2 sm:gap-3 shrink-0">
            <a 
              href={tool.website_url} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hidden sm:flex items-center gap-1 text-[11px] font-bold uppercase text-primary/70 hover:text-primary transition-colors"
            >
              Visit <ExternalLink className="h-3 w-3" />
            </a>
            {tool.avg_rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-600 text-amber-600" />
                <span className="text-[12px] text-muted-foreground">{tool.avg_rating.toFixed(1)}</span>
              </div>
            )}
            <VoteButton
              toolId={tool.id}
              initialCount={tool.upvote_count ?? 0}
            />
          </div>
        </div>
      </Link>
    )
  }

  if (cardStyle === 'home') {
    return (
      <Link href={`/tools/${tool.slug}`} className="block group h-full">
        <div className="gum-card card-hover rounded-[4px] p-5 min-h-[250px] relative flex flex-col">
          <div className="flex items-start gap-3 min-h-[66px]">
            <div className="h-10 w-10 rounded-[4px] border border-foreground/20 bg-background overflow-hidden flex items-center justify-center">
              {renderLogo(40)}
            </div>
            <div className="min-w-0 pt-0.5">
              <div className="flex items-start gap-1.5">
                <p className="font-semibold text-[16px] leading-[1.3] line-clamp-2 flex-1">{tool.name}</p>
                {tool.is_verified ? (
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-700 mt-0.5" />
                ) : null}
              </div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                {isWellFavored ? <WellFavoredBadge /> : null}
                <Badge variant="outline" className={`text-[11px] ${pricingColor}`}>{pricingLabel}</Badge>
              </div>
            </div>
          </div>

          <p className="mt-2 text-[14px] leading-[1.45] text-muted-foreground line-clamp-3 min-h-[62px]">{tool.tagline}</p>
          <div className="mt-auto pt-2.5 border-t border-foreground/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <VoteButton toolId={tool.id} initialCount={tool.upvote_count ?? 0} />
              <a 
                href={tool.website_url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-tight text-primary hover:underline"
              >
                Visit <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            {tool.avg_rating > 0 ? (
              <span className="inline-flex items-center gap-1 text-[14px] font-semibold leading-none">
                <Star className="h-3.5 w-3.5 fill-amber-600 text-amber-600" />
                {tool.avg_rating.toFixed(1)}
              </span>
            ) : (
              <button
                type="button"
                className="text-[13px] text-primary/70 hover:text-primary transition-colors"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.assign(`/tools/${tool.slug}#reviews`) }}
              >Be first to review</button>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/tools/${tool.slug}`} className="block group h-full">
      <div className="relative glass-card card-hover rounded-[4px] h-full flex flex-col overflow-hidden">
        {screenshotUrl && (
          <div className="relative h-32 border-b border-foreground/10 shrink-0 overflow-hidden">
            <Image
              src={screenshotUrl}
              alt={`${tool.name} screenshot`}
              fill
              className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-4 flex flex-col gap-3.5 flex-1">
          <VoteButton
            toolId={tool.id}
            initialCount={tool.upvote_count ?? 0}
            className="absolute right-3 top-3 z-10"
          />
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 shrink-0 rounded-[4px] bg-muted overflow-hidden flex items-center justify-center">
              {renderLogo(44)}
            </div>
            <div className="flex-1 min-w-0 pr-14">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[16px] group-hover:text-primary transition-colors leading-[1.3] line-clamp-2">{tool.name}</span>
                {tool.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 shrink-0" />}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {isWellFavored && <WellFavoredBadge />}
                <Badge variant="outline" className={`text-[11px] ${pricingColor}`}>{pricingLabel}</Badge>
              </div>
            </div>
          </div>

          <p className="text-[14px] text-muted-foreground line-clamp-3 min-h-[62px] flex-1 leading-[1.45]">{tool.tagline}</p>

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-foreground/10">
            <div className="flex items-center gap-2.5">
              <a 
                href={tool.website_url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-tight text-primary hover:underline"
              >
                Visit <ExternalLink className="h-3 w-3" />
              </a>
              {tool.avg_rating > 0 ? (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-600 text-amber-600" />
                  <span className="text-[13px] text-muted-foreground">{tool.avg_rating.toFixed(1)}</span>
                </div>
              ) : null}
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  )
}
