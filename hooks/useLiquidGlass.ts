'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import {
  buildLiquidGlassFilter,
  isChromium,
  type LiquidGlassConfig,
} from '@/lib/liquid-glass'

/**
 * Returns a ref to attach to your element. On Chromium browsers the hook
 * measures the element, builds an SVG displacement-map filter matching the
 * demo at liquid-glass-eta.vercel.app, injects it into the shared
 * <svg id="liquid-glass-defs"> in the DOM, and applies it as a
 * backdrop-filter on the element's ::after pseudo-element via a CSS class.
 *
 * On non-Chromium browsers the element keeps the existing CSS glassmorphism.
 *
 * Usage:
 *   const ref = useLiquidGlass<HTMLDivElement>({ radius: 20 })
 *   <div ref={ref} className="liquid-glass">...</div>
 *
 * The element MUST have the `liquid-glass` CSS class (defined in globals.css)
 * which sets up the ::after pseudo-element structure.
 */
export function useLiquidGlass<T extends HTMLElement>(
  opts: Partial<Omit<LiquidGlassConfig, 'width' | 'height'>> = {}
) {
  const ref = useRef<T>(null)
  const filterIdRef = useRef<string | null>(null)
  const [supported] = useState(() => isChromium())

  const rebuild = useCallback(() => {
    const el = ref.current
    if (!el || !supported) return

    const rect = el.getBoundingClientRect()
    const w = Math.round(rect.width)
    const h = Math.round(rect.height)
    if (w < 4 || h < 4) return

    // Get the computed border-radius if not explicitly provided
    const computedRadius = opts.radius ?? Math.min(
      parseInt(getComputedStyle(el).borderRadius) || 20,
      Math.min(w, h) / 2
    )

    const { filterId, filterSvg } = buildLiquidGlassFilter({
      width: w,
      height: h,
      radius: computedRadius,
      ...opts,
    })

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

    // Apply the backdrop-filter via a CSS custom property on the element
    // The .liquid-glass::after rule reads this variable
    el.style.setProperty('--lg-filter', `url(#${filterId})`)
    el.classList.add('liquid-glass--active')
  }, [opts, supported])

  useEffect(() => {
    rebuild()

    // Rebuild on resize (debounced)
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
    }
  }, [rebuild])

  return ref
}
