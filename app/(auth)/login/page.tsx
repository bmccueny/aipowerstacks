'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BrandMark } from '@/components/common/BrandMark'
// useLiquidGlass removed — iOS clean style

export default function LoginPage() {
  const [redirectTo, setRedirectTo] = useState('/dashboard')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('redirectTo')
    if (value) setRedirectTo(value)

    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        window.location.href = value || '/dashboard'
      } else {
        setCheckingAuth(false)
      }
    }).catch(() => setCheckingAuth(false))
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

  const handleGoogle = async () => {
    const supabase = createClient()
    const callback = new URL(`${window.location.origin}/auth/callback`)
    callback.searchParams.set('next', redirectTo)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback.toString() },
    })
  }

  if (checkingAuth) {
    return (
      <div className="w-full max-w-md mx-auto py-12 px-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto py-12 px-4 space-y-8">
      {/* Brand */}
      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <BrandMark className="h-10 w-10" />
          <span className="text-2xl font-bold tracking-[-0.035em] leading-none">
            <span className="text-primary font-extrabold">AI</span>PowerStacks
          </span>
        </Link>
      </div>

      {/* Main card — iOS clean */}
      <div className="bg-card border border-border rounded-2xl p-8 lg:p-10 space-y-6">
        {/* Heading */}
        <div className="text-center space-y-2">
          <h1 className="text-[28px] font-bold tracking-tight">Welcome back</h1>
          <p className="text-[15px] text-muted-foreground">Sign in to your account</p>
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 h-12 px-6 bg-background border border-border rounded-xl font-semibold text-[15px] hover:bg-muted/50 transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {/* Separator */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[13px] text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {error && (
          <div className="border border-destructive/30 bg-destructive/5 text-destructive text-[15px] font-medium p-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              aria-label="Email address"
              autoComplete="email"
              className="w-full h-12 px-4 bg-background border border-border rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-muted-foreground transition-all"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-muted-foreground">Password</label>
              <Link href="/forgot-password" className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                aria-label="Password"
                autoComplete="current-password"
                className="w-full h-12 px-4 pr-12 bg-background border border-border rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-muted-foreground transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary text-white rounded-xl font-semibold text-[15px] hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
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
