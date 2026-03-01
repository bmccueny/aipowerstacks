'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, ExternalLink, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ToolCardData } from '@/lib/types'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'
import { WellFavoredBadge } from './WellFavoredBadge'
import { AddToStackButton } from './AddToStackButton'
import { isWellFavoredTool } from '@/lib/tools/well-favored'

interface ToolCardProps {
  tool: ToolCardData
  view?: 'grid' | 'list'
  cardStyle?: 'default' | 'home'
}

export function ToolCard({ tool, view = 'grid', cardStyle = 'default' }: ToolCardProps) {
  const [imageError, setImageError] = useState(false)
  const [hasBeenHovered, setHasBeenHovered] = useState(false)
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
      <div 
        onMouseEnter={() => setHasBeenHovered(true)}
        className="glass-card rounded-xl px-5 py-4 flex flex-wrap sm:flex-nowrap items-center gap-4 group relative"
      >
        <div className="h-12 w-12 shrink-0 rounded-md bg-muted overflow-hidden flex items-center justify-center">
          {renderLogo(48)}
        </div>
        <div className="flex-1 min-w-[180px]">
          <div className="flex items-center gap-2">
            <Link
              href={`/tools/${tool.slug}`}
              className="font-semibold text-[16px] transition-colors truncate after:absolute after:inset-0 after:z-0"
            >
              {tool.name}
            </Link>
            {tool.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 shrink-0 relative z-10" />}
          </div>
          <p className="text-[14px] leading-[1.45] text-muted-foreground truncate mt-0.5 relative z-10">{tool.tagline}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 relative z-10">
            {isWellFavored && <WellFavoredBadge className="shrink-0" sparkle={hasBeenHovered} />}
            <Badge variant="outline" className={`text-[11px] ${pricingColor}`}>{pricingLabel}</Badge>
            {tool.has_api && <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">API</Badge>}
            {tool.is_open_source && <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Open Source</Badge>}
          </div>
        </div>
        <div className="w-full sm:w-auto sm:ml-auto flex items-center justify-end gap-2 sm:gap-3 shrink-0 relative z-10">
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
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[12px] text-muted-foreground">{tool.avg_rating.toFixed(1)}</span>
            </div>
          )}
          <div onClick={(e) => e.stopPropagation()}>
            <AddToStackButton toolId={tool.id} toolName={tool.name} />
          </div>
        </div>
      </div>
    )
  }

  if (cardStyle === 'home') {
    return (
      <div 
        onMouseEnter={() => setHasBeenHovered(true)}
        className="gum-card rounded-xl p-6 min-h-[280px] relative flex flex-col group h-full"
      >
        <div className="flex items-start gap-4 min-h-[72px]">
          <div className="h-12 w-12 rounded-md border border-foreground/20 bg-background overflow-hidden flex items-center justify-center relative z-10">
            {renderLogo(48)}
          </div>
          <div className="min-w-0 pt-0.5 flex-1">
            <div className="flex items-start gap-1.5">
              <Link
                href={`/tools/${tool.slug}`}
                className="font-semibold text-[18px] leading-[1.3] line-clamp-2 flex-1 after:absolute after:inset-0 after:z-0"
              >
                {tool.name}
              </Link>
              {tool.is_verified ? (
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-700 mt-0.5 relative z-10" />
              ) : null}
            </div>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap relative z-10">
              {isWellFavored ? <WellFavoredBadge sparkle={hasBeenHovered} /> : null}
              {tool.verified_by_admin && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 text-[10px] font-bold">
                  <ShieldCheck className="h-3 w-3" /> Expert Verified
                </Badge>
              )}
              <Badge variant="outline" className={`text-[11px] ${pricingColor}`}>{pricingLabel}</Badge>
              {tool.has_api && <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">API</Badge>}
              {tool.is_open_source && <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Open Source</Badge>}
            </div>
          </div>
        </div>

        <p className="mt-3 pb-0.5 text-[15px] leading-[1.5] text-muted-foreground line-clamp-2 relative z-10">{tool.tagline}</p>
        <div className="mt-auto pt-2.5 border-t border-foreground/10 flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
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
          <div onClick={(e) => e.stopPropagation()}>
            <AddToStackButton toolId={tool.id} toolName={tool.name} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      onMouseEnter={() => setHasBeenHovered(true)}
      className="relative glass-card rounded-xl h-full flex flex-col overflow-hidden group"
    >
      {screenshotUrl && (
        <div className="relative h-40 border-b border-foreground/10 shrink-0 overflow-hidden">
          <Image
            src={screenshotUrl}
            alt={`${tool.name} screenshot`}
            fill
            className="object-cover object-top transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 shrink-0 rounded-md bg-muted overflow-hidden flex items-center justify-center relative z-10">
            {renderLogo(56)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/tools/${tool.slug}`}
                className="font-semibold text-[18px] transition-colors leading-[1.3] line-clamp-2 after:absolute after:inset-0 after:z-0"
              >
                {tool.name}
              </Link>
              {tool.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 shrink-0 relative z-10" />}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 relative z-10">
              {isWellFavored && <WellFavoredBadge sparkle={hasBeenHovered} />}
              {tool.verified_by_admin && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 text-[10px] font-bold">
                  <ShieldCheck className="h-3 w-3" /> Expert Verified
                </Badge>
              )}
              <Badge variant="outline" className={`text-[11px] ${pricingColor}`}>{pricingLabel}</Badge>
            </div>
          </div>
        </div>

        <p className="pb-0.5 text-[15px] text-muted-foreground line-clamp-2 flex-1 leading-[1.5] relative z-10">{tool.tagline}</p>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-foreground/10 gap-3 relative z-10">
          <div className="min-w-0">
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
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <AddToStackButton toolId={tool.id} toolName={tool.name} />
          </div>
        </div>
      </div>
    </div>
  )
}
