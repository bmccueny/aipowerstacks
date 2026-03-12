'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export function AdminMobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close drawer on navigation
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 z-40 bg-background border-b border-border/50 flex items-center justify-between px-4 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-primary" />
          <span className="font-semibold text-sm">Admin</span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="h-10 w-10 flex items-center justify-center rounded-md hover:bg-muted/50 transition-colors"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-background border-r border-border/50 flex flex-col transition-transform duration-200 ease-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 flex items-center px-4 border-b border-border/50 shrink-0">
          <Link href="/admin" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">AIPowerStacks Admin</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {items.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href + '/'))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-muted/60 text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-2 py-3 border-t border-border/50 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            ← Back to site
          </Link>
        </div>
      </div>
    </>
  )
}
