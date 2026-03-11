'use client'

import React, { type ReactNode, type HTMLAttributes } from 'react'
import { useLiquidGlass } from '@/hooks/useLiquidGlass'
import { cn } from '@/lib/utils'
import type { LiquidGlassConfig, SurfaceType } from '@/lib/liquid-glass'

/**
 * Wrapper component that applies the liquid glass refraction effect.
 *
 * On Chromium: generates an SVG displacement-map filter from Snell's Law
 * and applies it as backdrop-filter on a ::after pseudo-element.
 * On other browsers: falls back to the CSS glassmorphism already on the element.
 *
 * The CSS class `liquid-glass` (globals.css) provides the pseudo-element
 * structure, inner shadow, tint, and outer shadow — matching the demo at
 * https://liquid-glass-eta.vercel.app/
 */
export function LiquidGlass({
  children,
  className,
  as: Tag = 'div',
  radius,
  surface,
  glassThickness,
  bezelWidth,
  ior,
  scaleRatio,
  blur,
  specularOpacity,
  specularSaturation,
  ...props
}: {
  children?: ReactNode
  className?: string
  as?: React.ElementType
  radius?: number
  surface?: SurfaceType
  glassThickness?: number
  bezelWidth?: number
  ior?: number
  scaleRatio?: number
  blur?: number
  specularOpacity?: number
  specularSaturation?: number
} & HTMLAttributes<HTMLElement>) {
  const ref = useLiquidGlass<HTMLDivElement>({
    radius,
    surface,
    glassThickness,
    bezelWidth,
    ior,
    scaleRatio,
    blur,
    specularOpacity,
    specularSaturation,
  })

  return (
    <Tag
      ref={ref}
      className={cn('liquid-glass', className)}
      {...props}
    >
      {children}
    </Tag>
  )
}
