'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Moon, Sun, ChevronDown, Layers, Layout, ArrowLeftRight, Newspaper } from 'lucide-react'
import { BrandMark } from '@/components/common/BrandMark'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from './NotificationBell'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/tools', label: 'Search' },
  { href: '/categories', label: 'Categories' },
]

const exploreLinks = [
  { href: '/stacks', label: 'Power Stacks', icon: Layers, desc: 'Curated community workflows' },
  { href: '/blog', label: 'News', icon: Newspaper, desc: 'Latest AI industry updates' },
  { href: '/blueprints', label: 'Blueprints', icon: Layout, desc: 'Ready-to-use AI recipes' },
  { href: '/compare', label: 'Compare', icon: ArrowLeftRight, desc: 'Head-to-head analysis' },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{
    id: string
    email?: string | null
    role?: string
    avatar_url?: string | null
    username?: string | null
    display_name?: string | null
  } | null>(null)
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
        .select('role, avatar_url, username, display_name')
        .eq('id', user.id)
        .maybeSingle()
      const p = profile as any
      setUser({
        id: user.id,
        email: user.email,
        role: p?.role ?? 'user',
        avatar_url: p?.avatar_url,
        username: p?.username,
        display_name: p?.display_name || user.email?.split('@')[0],
      })
    }

    loadUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { loadUser() })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    setMobileOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('tool_vote_')) localStorage.removeItem(key)
      })
    } catch (e) {
      console.error('Failed to clear vote state:', e)
    }
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

  const exploreActive = exploreLinks.some((l) => pathname.startsWith(l.href))

  const pillLink = (active: boolean) =>
    cn(
      'flex items-center justify-center whitespace-nowrap rounded-full border px-3 xl:px-5 py-2.5 text-sm xl:text-base font-medium no-underline transition-all duration-200',
      active
        ? 'border-foreground bg-foreground text-background dark:border-white dark:bg-white dark:text-black'
        : 'border-transparent bg-transparent text-foreground hover:border-foreground dark:text-white dark:hover:border-white/60'
    )

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-foreground dark:border-white/35">
      <div className="flex h-20 items-center justify-between pl-4 pr-4 lg:pl-6 xl:pl-8 lg:pr-0">

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark className="h-9 w-9 xl:h-10 xl:w-10" />
            <span className="font-display font-black text-[1.25rem] xl:text-[1.5rem] tracking-[-0.035em]">
              <span className="text-primary">AI</span>PowerStacks
            </span>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 px-2 xl:px-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={pillLink(isActive(link.href))}>
              {link.label}
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(pillLink(exploreActive), 'gap-1 cursor-pointer')}>
                Explore <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-2">
              {exploreLinks.map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href} className="flex items-start gap-3 p-3 cursor-pointer">
                    <div className="h-8 w-8 rounded bg-primary/5 flex items-center justify-center shrink-0 text-primary">
                      <link.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-none mb-1">{link.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{link.desc}</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/submit" className={pillLink(isActive('/submit'))}>
            Submit
          </Link>
        </nav>

        <div className="hidden lg:flex items-stretch h-20 border-l border-foreground dark:border-white/35">
          <div className="flex items-center gap-0.5 xl:gap-1 px-2 xl:px-4 border-r border-foreground/20 dark:border-white/20">
            <NotificationBell />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-foreground hover:border-foreground transition-all duration-200 dark:text-white dark:hover:border-white/60"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>

          {user ? (
            <>
              <Link
                href="/dashboard"
                aria-label="Go to Dashboard"
                className="flex items-center px-3 xl:px-6 border-r border-foreground bg-background hover:bg-primary/5 transition-colors duration-200 dark:border-white/35"
              >
                <Avatar className="h-11 w-11 xl:h-12 xl:w-12 border-2 border-foreground/10 dark:border-white/20">
                  <AvatarImage src={user.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-base xl:text-lg font-black">
                    {(user.display_name || user.username || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 xl:gap-2 px-3 xl:px-6 text-sm xl:text-base font-medium bg-primary text-black hover:bg-white transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden xl:inline">Sign Out</span>
                <span className="xl:hidden">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 xl:px-6 flex items-center text-sm xl:text-base font-medium border-r border-foreground bg-background text-foreground hover:bg-primary hover:text-foreground transition-colors duration-200 dark:border-white/35 dark:text-white"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="px-4 xl:px-6 flex items-center text-sm xl:text-base font-medium bg-foreground text-background hover:bg-primary hover:text-foreground transition-colors duration-200"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          className="relative flex h-8 w-8 flex-col items-center justify-center lg:hidden focus-visible:outline-none"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          <span
            className={cn(
              'mb-1 h-0.5 w-8 origin-center bg-foreground transition-transform duration-200',
              mobileOpen ? 'translate-y-1.5 rotate-45' : ''
            )}
          />
          <span
            className={cn(
              'mt-1 h-0.5 w-8 origin-center bg-foreground transition-transform duration-200',
              mobileOpen ? '-translate-y-1.5 -rotate-45' : ''
            )}
          />
        </button>
      </div>

      <div
        className={cn(
          'fixed top-20 left-0 right-0 z-50 flex-col border-b border-foreground bg-foreground text-background lg:hidden dark:border-white/35',
          mobileOpen ? 'flex' : 'hidden'
        )}
      >
        {navLinks.map((link) => (
          <Link
            key={`mobile-${link.href}`}
            href={link.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'px-6 py-4 text-lg font-medium border-b border-background/20 transition-colors text-center',
              isActive(link.href) ? 'bg-primary text-foreground' : 'hover:bg-primary hover:text-foreground'
            )}
          >
            {link.label}
          </Link>
        ))}
        {exploreLinks.map((link) => (
          <Link
            key={`mobile-explore-${link.href}`}
            href={link.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'px-6 py-4 text-lg font-medium border-b border-background/20 transition-colors text-center',
              isActive(link.href) ? 'bg-primary text-foreground' : 'hover:bg-primary hover:text-foreground'
            )}
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/submit"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'px-6 py-4 text-lg font-medium border-b border-background/20 transition-colors text-center',
            isActive('/submit') ? 'bg-primary text-foreground' : 'hover:bg-primary hover:text-foreground'
          )}
        >
          Submit Tool
        </Link>
        <button
          type="button"
          onClick={() => { toggleTheme(); setMobileOpen(false) }}
          className="flex items-center justify-center gap-2 px-6 py-4 text-lg font-medium border-b border-background/20 hover:bg-primary hover:text-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        {user ? (
          <>
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="px-6 py-4 text-lg font-medium border-b border-background/20 hover:bg-primary hover:text-foreground transition-colors text-center flex items-center justify-center gap-3"
            >
              <Avatar className="h-10 w-10 border border-background/20">
                <AvatarImage src={user.avatar_url ?? undefined} />
                <AvatarFallback className="text-sm font-black">
                  {(user.display_name || user.username || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              Dashboard
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 px-6 py-4 text-lg font-medium bg-primary text-black hover:bg-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="px-6 py-4 text-lg font-medium border-b border-background/20 hover:bg-primary hover:text-foreground transition-colors text-center"
            >
              Log in
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="px-6 py-4 text-lg font-medium bg-primary text-foreground hover:bg-primary/90 transition-colors text-center"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
