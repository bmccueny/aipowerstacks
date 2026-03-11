'use client'

import { useEffect, useRef } from 'react'

/**
 * Spawns a single twinkling star at a random position every ~1 second.
 * Each star fades in, glows briefly, then fades out.
 * Dark-mode only (visibility controlled via CSS).
 * Respects prefers-reduced-motion (container hidden via CSS).
 */
export default function TwinklingStars() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const spawn = () => {
      const star = document.createElement('div')
      star.className = 'twinkle-star'

      // Random position anywhere on screen
      star.style.top = `${Math.random() * 100}%`
      star.style.left = `${Math.random() * 100}%`

      // Random size: 1-3px
      const size = 1 + Math.random() * 2
      star.style.width = `${size}px`
      star.style.height = `${size}px`

      // Random duration: 0.8-1.8s
      const duration = 0.8 + Math.random() * 1
      star.style.setProperty('--twinkle-duration', `${duration}s`)

      container.appendChild(star)

      // Remove after animation completes
      setTimeout(() => {
        star.remove()
      }, duration * 1000 + 50)
    }

    // Spawn one every ~1 second with slight jitter
    const interval = setInterval(() => {
      spawn()
    }, 800 + Math.random() * 400)

    return () => {
      clearInterval(interval)
      if (container) container.innerHTML = ''
    }
  }, [])

  return <div ref={containerRef} className="twinkle-stars-container" aria-hidden="true" />
}
