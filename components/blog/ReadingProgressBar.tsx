'use client'

import { useEffect, useState } from 'react'

export function ReadingProgressBar() {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    function update() {
      const el = document.documentElement
      const scrollTop = el.scrollTop || document.body.scrollTop
      const scrollHeight = el.scrollHeight - el.clientHeight
      setWidth(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return <div className="reading-progress-bar" style={{ width: `${width}%` }} />
}
