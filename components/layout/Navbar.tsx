'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { User, Settings, LogOut, Menu, X } from 'lucide-react'
import { BrandMark } from '@/components/common/BrandMark'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/tools', label: 'Browse' },
  { href: '/tracker', label: 'Tracker' },
  { href: '/compare', label: 'Compare' },
  { href: '/blog', label: 'Blog' },
]

const moreLinks = [
  { href: '/categories', label: 'Categories' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: Record<string, string> } | null>(null)
  const [profile, setProfile] = useState<{ avatar_url: string | null; display_name: string | null } | null>(null)

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, display_name')
        .eq('id', userId)
        .maybeSingle()
      setProfile(data)
    }

    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) return
      setUser(user)
      if (user) fetchProfile(user.id)
    }
    getUser()

    // IMPORTANT: this callback must NOT be async — calling Supabase client
    // methods inside an async onAuthStateChange callback causes a deadlock
    // because the callback runs inside the auth lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Main Navbar */}
      <nav
        aria-label="Main navigation"
        className={cn(
          'fixed top-0 w-screen z-50 transition-all duration-300',
          scrolled
            ? 'bg-[#09090b]/80 backdrop-blur-xl saturate-150 border-b border-white/[0.06] shadow-lg shadow-black/20'
            : 'bg-transparent border-b border-transparent'
        )}
        style={{ left: 0, right: 0, width: '100vw' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ width: '100%', maxWidth: '80rem' }}>
          <div className="flex items-center justify-between h-14 min-w-0">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-3 group relative">
                <div className="relative">
                  <BrandMark className="h-8 w-8 transition-transform duration-200 group-hover:scale-110" />
                </div>
                <span className="text-lg font-semibold tracking-tight text-white hover:text-gray-200 transition-colors duration-200">
                  <span className="text-primary">AI</span>PowerStacks
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200',
                    ('/' + pathname.split('/')[1]) === link.href
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-300 hover:text-white hover:bg-white/[0.06]'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger className="px-4 py-2 text-sm font-semibold rounded-lg text-gray-300 hover:text-white hover:bg-white/[0.06] transition-all duration-200 outline-none">
                  More
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {moreLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link href={link.href} className="cursor-pointer">{link.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-lg" className="rounded-full hover:bg-white/[0.06] transition-all duration-200 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 flex-shrink-0 relative z-10">
                      <Avatar className="h-9 w-9 ring-2 ring-white/10 ring-offset-1 ring-offset-transparent transition-transform duration-200 hover:scale-110">
                        <AvatarImage
                          src={profile?.avatar_url || undefined}
                          alt={user.user_metadata?.full_name || user.user_metadata?.name || 'User'}
                        />
                        <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white ring-2 ring-primary/20">
                          {profile?.display_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() ||
                           user.user_metadata?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() ||
                           user.user_metadata?.name?.[0]?.toUpperCase() ||
                           user.email?.[0]?.toUpperCase() ||
                           'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-64 max-w-[90vw] shadow-xl border-white/10 bg-[#111113] z-[60]"
                    sideOffset={8}
                    alignOffset={0}
                    avoidCollisions={true}
                    collisionPadding={{ top: 16, right: 16, bottom: 16, left: 16 }}
                  >
                    <div className="px-4 py-3 border-b border-white/10 bg-white/[0.03] rounded-t-lg">
                      <p className="text-sm font-semibold text-white">
                        {profile?.display_name || user.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-400 font-medium">{user.email}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer hover:bg-white/[0.06] rounded-md mx-1">
                        <User className="h-4 w-4 mr-3" />
                        <span className="font-medium">Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer hover:bg-white/[0.06] rounded-md mx-1">
                        <Settings className="h-4 w-4 mr-3" />
                        <span className="font-medium">Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="mx-1" />
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-400 hover:bg-red-900/20 rounded-md mx-1">
                      <LogOut className="h-4 w-4 mr-3" />
                      <span className="font-medium">Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center gap-3">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all duration-200"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                  >
                    Sign up
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden rounded-lg hover:bg-white/[0.06] transition-colors duration-200"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={cn(
        'fixed inset-0 z-40 md:hidden transition-all duration-300',
        mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      )}>
        <div className="absolute inset-0 bg-black/25 backdrop-blur-md" onClick={() => setMobileOpen(false)} onKeyDown={(e) => { if (e.key === 'Escape') setMobileOpen(false) }} role="button" tabIndex={0} aria-label="Close menu" />

        <div className={cn(
          'liquid-glass-sheet absolute top-16 left-0 right-0 border-b border-foreground/[0.06] transform transition-transform duration-300 max-h-[calc(100vh-4rem)] overflow-y-auto pb-[env(safe-area-inset-bottom)]',
          mobileOpen ? 'translate-y-0' : '-translate-y-full'
        )}>
          <div className="px-4 py-6">
            {/* Mobile Navigation */}
            <nav className="space-y-1">
              {[...navLinks, ...moreLinks].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'block px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200',
                    ('/' + pathname.split('/')[1]) === link.href
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-300 hover:bg-white/[0.06]'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Auth */}
            {!user && (
              <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full px-6 py-3 text-center font-semibold text-gray-300 border border-white/15 rounded-full hover:bg-white/[0.06] transition-all duration-200 hover:opacity-90"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full px-6 py-3 text-center font-semibold bg-primary text-white rounded-full hover:bg-primary/90 hover:shadow-md transition-all duration-200 hover:opacity-90"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}