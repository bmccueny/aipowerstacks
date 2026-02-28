'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Moon, Sparkles, Sun } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/tools', label: 'Tools' },
  { href: '/categories', label: 'Categories' },
  { href: '/compare', label: 'Compare' },
  { href: '/blog', label: 'News' },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ id: string; email?: string | null; role?: string } | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(saved ?? (prefersDark ? 'dark' : 'light'))
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setUser(null); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      setUser({ id: user.id, email: user.email, role: (profile as { role?: string } | null)?.role ?? 'user' })
    }

    loadUser()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    setMobileOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'editor'

  const isActive = (href: string) => {
    const [path] = href.split('?')
    return pathname === path || (path !== '/' && pathname.startsWith(path))
  }

  return (
    <header className="sticky top-0 z-50 bg-background border-b-[1.5px] border-foreground">
      <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 lg:px-8">

        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-black text-base uppercase tracking-[0.08em]">AIPowerStacks</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3.5 py-1.5 text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55',
                isActive(link.href)
                  ? 'text-primary'
                  : 'text-foreground/60 hover:text-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/submit"
            className="ml-2 px-3.5 py-1.5 text-sm font-bold uppercase tracking-wider rounded-sm border border-foreground/30 hover:border-foreground hover:bg-foreground hover:text-background transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
          >
            Submit Tool
          </Link>
        </nav>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 rounded-sm text-foreground/60 hover:text-foreground hover:bg-foreground/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-4 py-2 text-sm font-bold uppercase tracking-wider border border-foreground bg-background hover:bg-foreground hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-bold uppercase tracking-wider border border-foreground bg-background hover:bg-foreground hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold uppercase tracking-wider border border-foreground bg-foreground text-background hover:bg-primary hover:border-primary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-bold uppercase tracking-wider border border-foreground bg-background hover:bg-foreground hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
              >
                Log in
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          className="relative flex h-8 w-8 flex-col items-center justify-center lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55 rounded-[4px]"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          <span
            className={cn(
              'mb-1 h-0.5 w-6 bg-foreground transition-transform duration-200',
              mobileOpen ? 'translate-y-1.5 rotate-45' : ''
            )}
          />
          <span
            className={cn(
              'mt-1 h-0.5 w-6 bg-foreground transition-transform duration-200',
              mobileOpen ? '-translate-y-1.5 -rotate-45' : ''
            )}
          />
        </button>
      </div>

      <div
        className={cn(
          'border-b-2 border-foreground bg-background lg:hidden',
          mobileOpen ? 'block' : 'hidden'
        )}
      >
        <div className="flex flex-col">
          {navLinks.map((link) => (
            <Link
              key={`mobile-${link.href}`}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'px-6 py-3.5 text-sm font-bold uppercase tracking-wider border-b border-foreground/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55',
                isActive(link.href)
                  ? 'text-primary bg-primary/5'
                  : 'text-foreground hover:bg-foreground/5'
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/submit"
            onClick={() => setMobileOpen(false)}
            className="px-6 py-3.5 text-sm font-bold uppercase tracking-wider border-b border-foreground/10 text-primary hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
          >
            Submit Tool
          </Link>
          <button
            type="button"
            onClick={() => { toggleTheme(); setMobileOpen(false) }}
            className="flex items-center gap-2 px-6 py-3.5 text-sm font-bold uppercase tracking-wider border-b border-foreground/10 text-foreground hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          {user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="px-6 py-3.5 text-sm font-bold uppercase tracking-wider border-b border-foreground/10 hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="px-6 py-3.5 text-sm font-bold uppercase tracking-wider border-b border-foreground/10 hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-left hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex gap-3 px-4 py-4">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 py-2.5 text-sm font-bold uppercase tracking-wider border border-foreground text-center hover:bg-foreground hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
              >
                Log in
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
