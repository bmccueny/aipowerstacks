'use client'

import React, { type ReactNode, type HTMLAttributes } from 'react'
import { useLiquidGlass, type UseLiquidGlassOpts } from '@/hooks/useLiquidGlass'
import { cn } from '@/lib/utils'
import type { GlassMode, SurfaceType } from '@/lib/liquid-glass'

/**
 * Wrapper component that applies the liquid glass effect.
 *
 * **mode = 'refraction'** (default)
 *   On Chromium: generates an SVG displacement-map filter from Snell's Law
 *   and applies it as backdrop-filter on a ::after pseudo-element.
 *   On other browsers: falls back to the CSS glassmorphism on the element.
 *
 * **mode = 'turbulence'**
 *   Cross-browser: uses feTurbulence + feSpecularLighting + feDisplacementMap
 *   for an organic wavy/rippled distortion (lucasromerodb approach).
 *   No canvas needed, works in all browsers with SVG filter support.
 *
 * The CSS class `liquid-glass` (globals.css) provides the pseudo-element
 * structure, inner shadow, tint, and outer shadow.
 */
export function LiquidGlass({
  children,
  className,
  as: Tag = 'div',
  mode,
  // Refraction props
  radius,
  surface,
  glassThickness,
  bezelWidth,
  ior,
  scaleRatio,
  blur,
  specularOpacity,
  specularSaturation,
  // Turbulence props
  baseFrequency,
  numOctaves,
  seed,
  displacementScale,
  specularExponent,
  surfaceScale,
  blurStdDeviation,
  lightPosition,
  ...props
}: {
  children?: ReactNode
  className?: string
  as?: React.ElementType
  mode?: GlassMode
  // Refraction-specific
  radius?: number
  surface?: SurfaceType
  glassThickness?: number
  bezelWidth?: number
  ior?: number
  scaleRatio?: number
  blur?: number
  specularOpacity?: number
  specularSaturation?: number
  // Turbulence-specific
  baseFrequency?: number
  numOctaves?: number
  seed?: number
  displacementScale?: number
  specularExponent?: number
  surfaceScale?: number
  blurStdDeviation?: number
  lightPosition?: { x: number; y: number; z: number }
} & HTMLAttributes<HTMLElement>) {
  const hookOpts: UseLiquidGlassOpts = mode === 'turbulence'
    ? {
        mode: 'turbulence',
        baseFrequency,
        numOctaves,
        seed,
        displacementScale,
        specularExponent,
        surfaceScale,
        blurStdDeviation,
        lightPosition,
      }
    : {
        mode: 'refraction',
        radius,
        surface,
        glassThickness,
        bezelWidth,
        ior,
        scaleRatio,
        blur,
        specularOpacity,
        specularSaturation,
      }

  const ref = useLiquidGlass<HTMLDivElement>(hookOpts)

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
