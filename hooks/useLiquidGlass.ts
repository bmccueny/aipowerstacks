'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import {
  buildLiquidGlassFilter,
  buildTurbulenceGlassFilter,
  isChromium,
  type GlassMode,
  type LiquidGlassConfig,
  type TurbulenceGlassConfig,
} from '@/lib/liquid-glass'

// ─── Option types ───────────────────────────────────────────────────

type RefractionOpts = Partial<Omit<LiquidGlassConfig, 'width' | 'height'>> & {
  mode?: 'refraction'
}

type TurbulenceOpts = TurbulenceGlassConfig & {
  mode: 'turbulence'
}

export type UseLiquidGlassOpts = RefractionOpts | TurbulenceOpts

/**
 * Returns a ref to attach to your element.
 *
 * **mode = 'refraction'** (default)
 *   Chromium-only: measures the element, builds an SVG displacement-map
 *   filter from Snell's Law refraction, injects it into the DOM, and
 *   applies it as `backdrop-filter` on the `::after` pseudo-element.
 *   Non-Chromium browsers keep the CSS glassmorphism fallback.
 *
 * **mode = 'turbulence'**
 *   Cross-browser: builds an SVG filter using `feTurbulence` +
 *   `feSpecularLighting` + `feDisplacementMap` (lucasromerodb approach).
 *   Produces an organic wavy/rippled distortion. No canvas computation
 *   needed, works in all browsers that support SVG filters.
 *   Applied via `filter` (not `backdrop-filter`) on the `::after`
 *   pseudo-element, with `backdrop-filter: blur(0px)` to access the
 *   backdrop content.
 *
 * Usage:
 *   // Refraction (default, unchanged)
 *   const ref = useLiquidGlass<HTMLDivElement>({ radius: 20 })
 *
 *   // Turbulence
 *   const ref = useLiquidGlass<HTMLDivElement>({
 *     mode: 'turbulence',
 *     displacementScale: 150,
 *   })
 *
 *   <div ref={ref} className="liquid-glass">...</div>
 *
 * The element MUST have the `liquid-glass` CSS class (defined in globals.css)
 * which sets up the ::after pseudo-element structure.
 */
export function useLiquidGlass<T extends HTMLElement>(
  opts: UseLiquidGlassOpts = {}
) {
  const ref = useRef<T>(null)
  const filterIdRef = useRef<string | null>(null)
  const mode: GlassMode = opts.mode ?? 'refraction'
  const [chromiumSupported] = useState(() => isChromium())

  const rebuild = useCallback(() => {
    const el = ref.current
    if (!el) return

    // Refraction mode requires Chromium; turbulence works everywhere
    if (mode === 'refraction' && !chromiumSupported) return

    let filterId: string
    let filterSvg: string

    if (mode === 'turbulence') {
      // Turbulence mode — pure SVG, no canvas/dimension dependency
      const turbOpts = opts as TurbulenceOpts
      const { mode: _, ...turbConfig } = turbOpts
      const result = buildTurbulenceGlassFilter(turbConfig)
      filterId = result.filterId
      filterSvg = result.filterSvg
    } else {
      // Refraction mode — needs element dimensions for displacement map
      const rect = el.getBoundingClientRect()
      const w = Math.round(rect.width)
      const h = Math.round(rect.height)
      if (w < 4 || h < 4) return

      const refOpts = opts as RefractionOpts
      const computedRadius = refOpts.radius ?? Math.min(
        parseInt(getComputedStyle(el).borderRadius) || 20,
        Math.min(w, h) / 2
      )

      const result = buildLiquidGlassFilter({
        width: w,
        height: h,
        radius: computedRadius,
        ...refOpts,
      })
      filterId = result.filterId
      filterSvg = result.filterSvg
    }

    if (!filterSvg) return

    // Ensure shared SVG defs container exists
    let svgDefs: Element | null = document.getElementById('liquid-glass-defs')
    if (!svgDefs) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', '0')
      svg.setAttribute('height', '0')
      svg.setAttribute('style', 'position:absolute;overflow:hidden;pointer-events:none')
      svg.setAttribute('aria-hidden', 'true')
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
      defs.id = 'liquid-glass-defs'
      svg.appendChild(defs)
      document.body.appendChild(svg)
      svgDefs = defs
    }

    // Remove old filter if rebuilding
    if (filterIdRef.current) {
      const old = document.getElementById(filterIdRef.current)
      if (old) old.remove()
    }

    // Insert new filter
    const temp = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    temp.innerHTML = filterSvg
    const filterEl = temp.firstElementChild
    if (filterEl) {
      svgDefs.appendChild(filterEl)
    }

    filterIdRef.current = filterId

    // Clean up any previous mode class
    el.classList.remove('liquid-glass--active', 'liquid-glass--turbulence')

    if (mode === 'turbulence') {
      // Turbulence uses filter (not backdrop-filter) on ::after
      el.style.setProperty('--lg-turb-filter', `url(#${filterId})`)
      el.style.removeProperty('--lg-filter')
      el.classList.add('liquid-glass--turbulence')
    } else {
      // Refraction uses backdrop-filter on ::after
      el.style.setProperty('--lg-filter', `url(#${filterId})`)
      el.style.removeProperty('--lg-turb-filter')
      el.classList.add('liquid-glass--active')
    }
  }, [opts, mode, chromiumSupported])

  useEffect(() => {
    rebuild()

    // Rebuild on resize (debounced) — mainly needed for refraction mode
    // which depends on element dimensions, but also keeps turbulence
    // filter in sync if the element changes
    let timer: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(rebuild, 200)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(timer)
      // Clean up filter from defs
      if (filterIdRef.current) {
        const old = document.getElementById(filterIdRef.current)
        if (old) old.remove()
      }
      // Clean up mode classes
      const el = ref.current
      if (el) {
        el.classList.remove('liquid-glass--active', 'liquid-glass--turbulence')
        el.style.removeProperty('--lg-filter')
        el.style.removeProperty('--lg-turb-filter')
      }
    }
  }, [rebuild])

  return ref
}
