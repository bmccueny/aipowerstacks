'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BrandMark } from '@/components/common/BrandMark'
import { useLiquidGlass } from '@/hooks/useLiquidGlass'

export default function LoginPage() {
  const [redirectTo, setRedirectTo] = useState('/dashboard')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('redirectTo')
    if (value) setRedirectTo(value)

    // If already logged in, redirect immediately
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        window.location.href = value || '/dashboard'
      }
    })
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = redirectTo
    }
  }

  const cardRef = useLiquidGlass<HTMLDivElement>({
    radius: 24,
    glassThickness: 80,
    bezelWidth: 60,
    ior: 3.0,
    blur: 0.3,
    specularOpacity: 0.5,
    specularSaturation: 4,
  })

  const handleGoogle = async () => {
    const supabase = createClient()
    const callback = new URL(`${window.location.origin}/auth/callback`)
    callback.searchParams.set('next', redirectTo)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback.toString() },
    })
  }

  return (
    <div className="w-full max-w-md mx-auto py-12 px-4 space-y-8">
      {/* Brand */}
      <div className="animate-in-stagger text-center" style={{ animationDelay: '0ms' }}>
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute -inset-2 rounded-xl bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <BrandMark className="h-10 w-10 relative animate-liquid-float" />
          </div>
          <span className="text-2xl font-black tracking-[-0.035em] leading-none">
            <span className="text-primary">AI</span>PowerStacks
          </span>
        </Link>
      </div>

      {/* Main glass card */}
      <div className="relative animate-in-stagger" style={{ animationDelay: '60ms' }}>
        <div className="absolute inset-0 glass-card rounded-3xl blur-2xl scale-110 opacity-30" />
        <div
          ref={cardRef}
          className="relative liquid-glass glass-card rounded-3xl p-8 lg:p-10 border border-white/15 overflow-hidden space-y-6"
        >
          {/* Crimson accent line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />

          {/* Heading */}
          <div className="text-center space-y-2 pt-2">
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground font-medium">Sign in to your account</p>
          </div>

          {/* Google OAuth */}
          <div className="animate-in-stagger" style={{ animationDelay: '120ms' }}>
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 h-12 px-6 glass-card border border-border/50 rounded-xl font-semibold text-base hover:border-white/30 hover:shadow-xl transition-all duration-300"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Separator */}
          <div className="animate-in-stagger flex items-center gap-4 py-1" style={{ animationDelay: '160ms' }}>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-border/40" />
            <span className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider shrink-0">or</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-border/40" />
          </div>

          {error && (
            <div className="glass-card border border-destructive/30 bg-destructive/5 text-destructive text-sm font-semibold p-4 rounded-xl flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="animate-in-stagger space-y-2" style={{ animationDelay: '200ms' }}>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
              <div className="relative group/field">
                <div className="absolute -inset-px rounded-xl bg-primary/0 blur-md transition-all duration-300 group-focus-within/field:bg-primary/15 group-focus-within/field:blur-lg" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="relative w-full h-12 px-5 glass-card border border-white/10 rounded-xl font-medium text-base focus:outline-none focus-visible:border-primary/50 placeholder:text-muted-foreground/40 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="animate-in-stagger space-y-2" style={{ animationDelay: '260ms' }}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
                <Link href="/forgot-password" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative group/field">
                <div className="absolute -inset-px rounded-xl bg-primary/0 blur-md transition-all duration-300 group-focus-within/field:bg-primary/15 group-focus-within/field:blur-lg" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="relative w-full h-12 px-5 pr-12 glass-card border border-white/10 rounded-xl font-medium text-base focus:outline-none focus-visible:border-primary/50 placeholder:text-muted-foreground/40 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="animate-in-stagger relative pt-2" style={{ animationDelay: '320ms' }}>
              <div className="absolute -inset-1 rounded-2xl bg-primary/20 blur-xl animate-pulse opacity-60" />
              <button
                type="submit"
                disabled={loading}
                className="relative w-full h-12 btn-primary rounded-2xl disabled:opacity-50 group shadow-2xl hover:shadow-[0_0_40px_oklch(0.62_0.23_22/0.4)] transition-all duration-300"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="animate-in-stagger text-center space-y-4" style={{ animationDelay: '380ms' }}>
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href={`/register${redirectTo !== '/dashboard' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`} className="text-primary font-bold hover:underline">Sign up</Link>
        </p>
        <div className="flex justify-center gap-6 text-xs text-muted-foreground/50">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        </div>
      </div>
    </div>
  )
}
