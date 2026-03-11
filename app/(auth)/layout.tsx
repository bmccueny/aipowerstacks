'use client'

import { useEffect, useRef } from 'react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      el.style.setProperty('--mouse-x', `${e.clientX}px`)
      el.style.setProperty('--mouse-y', `${e.clientY}px`)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
    >
      <div className="stars" aria-hidden="true" />
      <div className="nebula" aria-hidden="true" />
      {/* Mouse-following crimson glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-0 dark:opacity-30 transition-opacity duration-700"
        style={{
          background:
            'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), oklch(0.62 0.23 22 / 0.12), transparent 60%)',
        }}
        aria-hidden="true"
      />
      <div className="relative z-[1] w-full">
        {children}
      </div>
    </div>
  )
}
