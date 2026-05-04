'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, DollarSign, ArrowLeftRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/tools', label: 'Browse', icon: LayoutGrid },
  { href: '/tracker', label: 'Tracker', icon: DollarSign },
  { href: '/compare', label: 'Compare', icon: ArrowLeftRight },
  { href: '/blog', label: 'More', icon: MoreHorizontal },
]

export function MobileTabBar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/80 backdrop-blur-2xl backdrop-saturate-150 border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-[49px]">
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
                active ? 'text-primary' : 'text-[#8E8E93]'
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
