'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * A utility component that scrolls the comparison matrix into view
 * whenever the 'tools' search parameter changes on mobile.
 */
export function MatrixAutoFocus() {
  const searchParams = useSearchParams()
  const tools = searchParams.get('tools')

  useEffect(() => {
    // Only auto-scroll on mobile devices
    if (window.innerWidth < 1024 && tools) {
      const matrix = document.getElementById('comparison-matrix')
      if (matrix) {
        // Offset a bit to account for the sticky navbar (80px)
        const offset = 90
        const bodyRect = document.body.getBoundingClientRect().top
        const elementRect = matrix.getBoundingClientRect().top
        const elementPosition = elementRect - bodyRect
        const offsetPosition = elementPosition - offset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }
  }, [tools])

  return null
}
