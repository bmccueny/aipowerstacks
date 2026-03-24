'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, ExternalLink, Clock, Zap, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ToolCardData } from '@/lib/types'
import { PRICING_BADGE_COLORS, PRICING_LABELS, MODEL_PROVIDER_LABELS, USE_CASE_LABELS, TIME_TO_VALUE_LABELS } from '@/lib/constants'
import { WellFavoredBadge } from './WellFavoredBadge'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { AddToStackButton } from './AddToStackButton'
import { AddToCompareButton } from './AddToCompareButton'
import { isWellFavoredTool } from '@/lib/tools/well-favored'
import { getFreshnessLevel } from '@/lib/tools/freshness'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Shared types & helpers
// ---------------------------------------------------------------------------

interface ToolCardProps {
  tool: ToolCardData
  view?: 'grid' | 'list'
  cardStyle?: 'default' | 'home'
  compact?: boolean
}

/** Resolved values derived from the tool, shared across sub-components. */
interface ResolvedToolProps {
  tool: ToolCardData
  compact: boolean
  pricingColor: string
  pricingLabel: string
  screenshotUrl: string | null
  isWellFavored: boolean
  imageError: boolean
  setImageError: (v: boolean) => void
  hasBeenHovered: boolean
  setHasBeenHovered: (v: boolean) => void
}

// ---------------------------------------------------------------------------
// ToolCardLogo — shared logo renderer with error fallback
// ---------------------------------------------------------------------------

function ToolCardLogo({
  logoUrl,
  name,
  size,
  compact,
  imageError,
  onError,
}: {
  logoUrl: string | null
  name: string
  size: number
  compact?: boolean
  imageError: boolean
  onError: () => void
}) {
  if (!logoUrl || imageError) {
    return (
      <span className={cn('font-black text-primary uppercase', compact ? 'text-base' : 'text-base')}>
        {name[0]}
      </span>
    )
  }
  return (
    <img
      src={logoUrl}
      alt={name}
      width={size}
      height={size}
      className="object-contain"
      onError={onError}
    />
  )
}

// ---------------------------------------------------------------------------
// PricingBadge — shared pricing display (tags vs fallback label)
// ---------------------------------------------------------------------------

/** Variant used by the list view and the compact-home footer. */
function PricingBadgeBadgeStyle({
  tool,
  pricingColor,
  pricingLabel,
}: {
  tool: ToolCardData
  pricingColor: string
  pricingLabel: string
}) {
  if (tool.pricing_tags && tool.pricing_tags.length > 0) {
    return (
      <>
        {tool.pricing_tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="text-[10px] bg-stone-100 text-stone-600 border-stone-200 uppercase font-bold"
          >
            {tag}
          </Badge>
        ))}
      </>
    )
  }
  return (
    <Badge variant="outline" className={`text-[11px] ${pricingColor}`}>
      {pricingLabel}
    </Badge>
  )
}

/** Variant used by grid and home-default views (span-based). */
function PricingBadgeSpanStyle({
  tool,
  pricingColor,
  pricingLabel,
  limit,
}: {
  tool: ToolCardData
  pricingColor: string
  pricingLabel: string
  limit?: number
}) {
  if (tool.pricing_tags && tool.pricing_tags.length > 0) {
    return (
      <>
        {(limit ? tool.pricing_tags.slice(0, limit) : tool.pricing_tags).map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
          >
            {tag}
          </span>
        ))}
      </>
    )
  }
  return (
    <span className={cn('text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border', pricingColor)}>
      {pricingLabel}
    </span>
  )
}

/** Model-provider badge shared across views. */
function ModelProviderBadge({
  tool,
  variant = 'span',
}: {
  tool: ToolCardData
  variant?: 'badge' | 'span'
}) {
  if (!tool.model_provider || tool.model_provider === 'proprietary') return null
  const label = `${tool.is_api_wrapper ? '⚠ Wrapper' : variant === 'badge' ? 'Powered by' : '⚡'} ${MODEL_PROVIDER_LABELS[tool.model_provider] ?? tool.model_provider}`

  if (variant === 'badge') {
    return (
      <Badge
        variant="secondary"
        className="text-[10px] bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800"
      >
        {label}
      </Badge>
    )
  }

  return (
    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800">
      {label}
    </span>
  )
}

/** Capability pills — use case + API / Open Source / Mobile */
function CapabilityBadges({ tool, variant = 'span' }: { tool: ToolCardData; variant?: 'badge' | 'span' }) {
  const pills: { label: string; cls: string }[] = []

  if (tool.use_case && USE_CASE_LABELS[tool.use_case]) {
    pills.push({ label: USE_CASE_LABELS[tool.use_case], cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800' })
  }
  if (tool.has_api) {
    pills.push({ label: 'API', cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' })
  }
  if (tool.is_open_source) {
    pills.push({ label: 'Open Source', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' })
  }
  if (tool.has_mobile_app) {
    pills.push({ label: 'Mobile', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' })
  }
  const dt = (tool as Record<string, unknown>).deployment_type as string | null
  if (dt === 'self-hosted') {
    pills.push({ label: 'Self-Hosted', cls: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800' })
  } else if (dt === 'both') {
    pills.push({ label: 'Local + Cloud', cls: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800' })
  }

  if (pills.length === 0) return null

  if (variant === 'badge') {
    return (
      <>
        {pills.map((p) => (
          <Badge key={p.label} variant="secondary" className={cn('text-[10px]', p.cls)}>{p.label}</Badge>
        ))}
      </>
    )
  }

  return (
    <>
      {pills.map((p) => (
        <span key={p.label} className={cn('text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border', p.cls)}>
          {p.label}
        </span>
      ))}
    </>
  )
}

/** Subtle stale data indicator for cards */
function StaleIndicator({ tool }: { tool: ToolCardData }) {
  const updatedAt = (tool as Record<string, unknown>).updated_at as string | null
  const level = getFreshnessLevel(updatedAt)
  if (level !== 'stale') return null
  return (
    <span className="text-[10px] text-amber-500/70 dark:text-amber-400/60 flex items-center gap-1">
      <Clock className="h-3 w-3" />
      Data may be outdated
    </span>
  )
}

/** Time to value indicator */
function TimeToValueBadge({ tool }: { tool: ToolCardData }) {
  const ttv = (tool as Record<string, unknown>).time_to_value as string | null
  if (!ttv || !TIME_TO_VALUE_LABELS[ttv]) return null
  const { label, cls } = TIME_TO_VALUE_LABELS[ttv]
  return (
    <span className={cn('text-[10px] font-bold flex items-center gap-1', cls)}>
      <Zap className="h-3 w-3" />
      {label}
    </span>
  )
}

/** "Not for" warning */
function NotForWarning({ tool }: { tool: ToolCardData }) {
  const notFor = (tool as Record<string, unknown>).not_for as string | null
  if (!notFor) return null
  return (
    <p className="text-[10px] text-red-400/70 dark:text-red-400/50 flex items-center gap-1 relative z-10">
      <AlertTriangle className="h-3 w-3 shrink-0" />
      <span className="line-clamp-1">{notFor}</span>
    </p>
  )
}

// ---------------------------------------------------------------------------
// ToolCardList — view === 'list'
// ---------------------------------------------------------------------------

function ToolCardList({ tool, pricingColor, pricingLabel, isWellFavored, imageError, setImageError, hasBeenHovered, setHasBeenHovered, compact }: ResolvedToolProps) {
  return (
    <div
      onMouseEnter={() => setHasBeenHovered(true)}
      className="glass-card rounded-xl px-5 py-4 flex flex-wrap sm:flex-nowrap items-center gap-4 group relative cursor-pointer"
    >
      <div className="h-12 w-12 shrink-0 rounded-md bg-muted overflow-hidden flex items-center justify-center">
        <ToolCardLogo logoUrl={tool.logo_url} name={tool.name} size={48} compact={compact} imageError={imageError} onError={() => setImageError(true)} />
      </div>
      <div className="flex-1 min-w-[180px]">
        <div className="flex items-center gap-2">
          <Link
            href={`/tools/${tool.slug}`}
            className="font-semibold text-[16px] transition-colors truncate after:absolute after:inset-0 after:z-0"
          >
            {tool.name}
          </Link>
          {tool.is_verified && <VerifiedBadge size="sm" className="relative z-10" />}
        </div>
        <p className="text-[14px] leading-[1.45] text-muted-foreground truncate mt-0.5 relative z-10">{tool.tagline}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 relative z-10">
          {isWellFavored && <WellFavoredBadge className="shrink-0" sparkle={hasBeenHovered} />}
          <div className="flex flex-wrap gap-1">
            <PricingBadgeBadgeStyle tool={tool} pricingColor={pricingColor} pricingLabel={pricingLabel} />
          </div>
          <CapabilityBadges tool={tool} variant="badge" />
          <ModelProviderBadge tool={tool} variant="badge" />
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

// ---------------------------------------------------------------------------
// ToolCardHome — cardStyle === 'home'
// ---------------------------------------------------------------------------

function ToolCardHome({ tool, compact, pricingColor, pricingLabel, isWellFavored, imageError, setImageError, hasBeenHovered, setHasBeenHovered }: ResolvedToolProps) {
  return (
    <div
      onMouseEnter={() => setHasBeenHovered(true)}
      className={cn(
        'card-directory relative flex flex-col group h-full hover:shadow-[0_20px_40px_-8px_rgba(0,0,0,0.15)] transition-all duration-300',
        compact ? 'p-5 min-h-[220px] items-center text-center' : 'p-6 min-h-[280px]'
      )}
    >
      {compact ? (
        <div className="flex flex-col items-center justify-center flex-1 w-full gap-4">
          {tool.is_verified && (
            <div className="absolute top-4 right-4 z-20 glass-card rounded-xl p-2 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12)] border border-primary/20">
              <VerifiedBadge size="sm" />
            </div>
          )}
          <div className="relative">
            <div className="absolute inset-0 glass-card rounded-3xl blur-sm scale-110 opacity-60" />
            <div className="relative h-20 w-20 rounded-3xl bg-background/80 backdrop-blur-sm shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12)] overflow-hidden flex items-center justify-center z-10 transition-all duration-300 group-hover:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.18)]">
              <ToolCardLogo logoUrl={tool.logo_url} name={tool.name} size={80} compact={compact} imageError={imageError} onError={() => setImageError(true)} />
            </div>
          </div>
          <div className="min-w-0 px-2">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Link href={`/tools/${tool.slug}`} className="font-black tracking-tight text-xl leading-tight line-clamp-1 after:absolute after:inset-0 after:z-0">
                {tool.name}
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-4 min-h-[72px]">
            <div className="h-12 w-12 rounded-md bg-background overflow-hidden flex items-center justify-center relative z-10 shrink-0">
              <ToolCardLogo logoUrl={tool.logo_url} name={tool.name} size={48} compact={compact} imageError={imageError} onError={() => setImageError(true)} />
            </div>
            <div className="min-w-0 pt-0.5 flex-1">
              <div className="flex items-start gap-1.5">
                <Link
                  href={`/tools/${tool.slug}`}
                  className="font-black text-xl leading-[1.3] line-clamp-2 flex-1 after:absolute after:inset-0 after:z-0"
                >
                  {tool.name}
                </Link>
                {tool.is_verified && <VerifiedBadge size="sm" className="mt-0.5 relative z-10" />}
              </div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap relative z-10">
                {tool.avg_rating > 0 ? (
                  <>
                    <Star className="h-3.5 w-3.5 fill-primary text-primary shrink-0" />
                    <span className="text-[13px] font-bold leading-none">{tool.avg_rating.toFixed(1)}</span>
                    <span className="text-[11px] text-muted-foreground">({tool.review_count})</span>
                  </>
                ) : null}
                {isWellFavored ? <WellFavoredBadge sparkle={hasBeenHovered} /> : null}
                <div className="flex flex-wrap gap-1">
                  <PricingBadgeSpanStyle tool={tool} pricingColor={pricingColor} pricingLabel={pricingLabel} limit={1} />
                  <ModelProviderBadge tool={tool} variant="span" />
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 pb-0.5 text-base leading-[1.5] font-medium text-muted-foreground line-clamp-2 relative z-10">{tool.tagline}</p>

          {/* Capability badges */}
          <div className="mt-2 flex flex-wrap gap-1 items-center relative z-10">
            <CapabilityBadges tool={tool} variant="span" />
            <TimeToValueBadge tool={tool} />
            <StaleIndicator tool={tool} />
          </div>
          <NotForWarning tool={tool} />
        </>
      )}

      <div className={cn(
        'mt-auto pt-2.5 border-t border-foreground/10 flex items-center justify-between gap-3 relative z-10 w-full',
        compact && 'pt-3 mt-4'
      )}>
        {compact ? (
          <>
            <div className="flex flex-wrap gap-1 flex-1 relative z-10">
              {tool.pricing_tags && tool.pricing_tags.length > 0 ? (
                <Badge variant="secondary" className="bg-stone-100 text-stone-600 border-stone-200 uppercase font-black text-[10px] h-6 px-2.5 leading-none">
                  {tool.pricing_tags[0]}
                </Badge>
              ) : (
                <Badge variant="outline" className={cn('font-black uppercase text-[10px] h-6 px-2.5', pricingColor)}>
                  {pricingLabel}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 relative z-10">
              <a
                href={tool.website_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="h-9 w-9 flex items-center justify-center rounded-sm border border-foreground/10 text-primary hover:bg-primary/5 transition-colors"
                title="Visit Website"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <AddToStackButton toolId={tool.id} toolName={tool.name} iconOnly={true} />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
            <AddToStackButton toolId={tool.id} toolName={tool.name} className="flex-1" />
            <AddToCompareButton slug={tool.slug} name={tool.name} iconOnly />
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ToolCardGrid — default grid view
// ---------------------------------------------------------------------------

function ToolCardGrid({ tool, pricingColor, pricingLabel, screenshotUrl, isWellFavored, imageError, setImageError, hasBeenHovered, setHasBeenHovered, compact }: ResolvedToolProps) {
  return (
    <div
      onMouseEnter={() => setHasBeenHovered(true)}
      className="relative card-directory h-full flex flex-col group"
    >
      {screenshotUrl && (
        <div className="relative h-40 border-b border-foreground/10 shrink-0 overflow-hidden rounded-t-[14px]">
          <Image
            src={screenshotUrl}
            alt={`${tool.name} screenshot`}
            fill
            className="object-cover object-top transition-transform duration-300"
          />
        </div>
      )}

      {/* Top bar: pricing badge right-aligned */}
      <div className="px-5 pt-4 flex items-center justify-end gap-2 relative z-10">
        {tool.pricing_tags && tool.pricing_tags.length > 0 ? (
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {tool.pricing_tags[0]}
          </span>
        ) : (
          <span className={cn('text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border', pricingColor)}>
            {pricingLabel}
          </span>
        )}
      </div>

      <div className="px-5 pb-5 flex flex-col gap-3 flex-1">
        {/* Logo + name + rating */}
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 shrink-0 rounded-md bg-muted overflow-hidden flex items-center justify-center relative z-10">
            <ToolCardLogo logoUrl={tool.logo_url} name={tool.name} size={56} compact={compact} imageError={imageError} onError={() => setImageError(true)} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/tools/${tool.slug}`}
                className="font-bold text-[18px] leading-[1.3] line-clamp-2 after:absolute after:inset-0 after:z-0"
              >
                {tool.name}
              </Link>
              {tool.is_verified && <VerifiedBadge size="sm" className="relative z-10 shrink-0" />}
            </div>
            {/* Rating */}
            <div className="mt-1 flex items-center gap-1.5 relative z-10">
              {tool.avg_rating > 0 ? (
                <>
                  <Star className="h-4 w-4 fill-primary text-primary shrink-0" />
                  <span className="text-[15px] font-bold leading-none">{tool.avg_rating.toFixed(1)}</span>
                  <span className="text-[12px] text-muted-foreground">({tool.review_count})</span>
                </>
              ) : (
                <span className="text-[12px] text-muted-foreground/50">No reviews yet</span>
              )}
              {isWellFavored && <WellFavoredBadge sparkle={hasBeenHovered} className="ml-1" />}
            </div>
          </div>
        </div>

        <p className="text-[14px] text-muted-foreground line-clamp-2 leading-[1.5] relative z-10">{tool.tagline}</p>

        {/* Capability badges */}
        <div className="flex flex-wrap gap-1 items-center relative z-10">
          <CapabilityBadges tool={tool} variant="span" />
          <ModelProviderBadge tool={tool} variant="span" />
          <TimeToValueBadge tool={tool} />
          <StaleIndicator tool={tool} />
        </div>

        <NotForWarning tool={tool} />

        {/* Footer: Stack + Compare */}
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-foreground/10 relative z-10" onClick={(e) => e.stopPropagation()}>
          <AddToStackButton toolId={tool.id} toolName={tool.name} className="flex-1" />
          <AddToCompareButton slug={tool.slug} name={tool.name} iconOnly />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ToolCard — public API (thin router)
// ---------------------------------------------------------------------------

export function ToolCard({ tool, view = 'grid', cardStyle = 'default', compact = false }: ToolCardProps) {
  const [imageError, setImageError] = useState(false)
  const [hasBeenHovered, setHasBeenHovered] = useState(false)
  const pricingColor = PRICING_BADGE_COLORS[tool.pricing_model] ?? PRICING_BADGE_COLORS.unknown
  const pricingLabel = PRICING_LABELS[tool.pricing_model] ?? 'Unknown'
  const screenshotUrl = (tool.screenshot_urls as string[] | null)?.[0] ?? null
  const wellFavored = isWellFavoredTool(tool)

  const shared: ResolvedToolProps = {
    tool,
    compact,
    pricingColor,
    pricingLabel,
    screenshotUrl,
    isWellFavored: wellFavored,
    imageError,
    setImageError,
    hasBeenHovered,
    setHasBeenHovered,
  }

  if (view === 'list') {
    return <ToolCardList {...shared} />
  }

  if (cardStyle === 'home') {
    return <ToolCardHome {...shared} />
  }

  return <ToolCardGrid {...shared} />
}
