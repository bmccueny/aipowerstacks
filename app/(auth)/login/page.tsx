'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { BrandMark } from '@/components/common/BrandMark'

export default function LoginPage() {
  const router = useRouter()
  const [redirectTo, setRedirectTo] = useState('/dashboard')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('redirectTo')
    if (value) setRedirectTo(value)
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
      router.push(redirectTo)
      router.refresh()
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

  return (
    <div className="flex min-h-screen bg-[#f4f4f0] text-black font-sans selection:bg-primary/30">
      {/* Left Side: Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="p-8 lg:p-12 flex items-center justify-between border-b border-black">
          <Link href="/" className="flex items-center gap-3">
             <BrandMark className="h-10 w-10" />
             <span className="text-2xl font-black tracking-[-0.035em] leading-none">
                <span className="text-primary">AI</span>PowerStacks
             </span>
          </Link>
          <Link 
            href="/register" 
            className="text-sm font-bold underline underline-offset-4 hover:text-primary transition-colors"
          >
            Sign up
          </Link>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col justify-center p-8 lg:p-24 max-w-2xl mx-auto w-full">
          <div className="mb-12">
            <h1 className="text-4xl lg:text-6xl font-black tracking-tight mb-4">Log in</h1>
            <p className="text-lg font-medium opacity-60">Welcome back to the stack.</p>
          </div>

          <div className="space-y-8">
            {/* Social Auth */}
            <button 
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-4 py-4 px-6 bg-white border-2 border-black rounded-sm font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
            >
               <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Log in with Google
            </button>

            {/* Separator */}
            <div className="relative py-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-black/10" />
              </div>
              <span className="relative z-10 bg-[#f5f4f0] px-6 text-sm font-black uppercase tracking-widest text-black/40">
                or with email
              </span>
            </div>

            {error && (
              <div className="bg-[#dc341e]/10 border-2 border-[#dc341e] text-[#dc341e] text-sm font-bold p-4 rounded-sm flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#dc341e] animate-pulse" />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-8">
              <fieldset className="group">
                <legend className="w-full mb-3 flex items-center justify-between">
                  <span className="text-sm font-black uppercase tracking-widest opacity-60">Email</span>
                </legend>
                <div className="bg-white border-2 border-black rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all focus-within:translate-x-[-2px] focus-within:translate-y-[-2px] focus-within:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full h-14 px-6 bg-transparent font-bold text-lg focus:outline-none placeholder:opacity-30"
                  />
                </div>
              </fieldset>

              <fieldset className="group">
                <legend className="w-full mb-3 flex items-center justify-between">
                  <span className="text-sm font-black uppercase tracking-widest opacity-60">Password</span>
                  <Link href="/forgot-password" className="text-xs font-bold underline underline-offset-2 hover:text-primary">
                    Forgot your password?
                  </Link>
                </legend>
                <div className="relative bg-white border-2 border-black rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all focus-within:translate-x-[-2px] focus-within:translate-y-[-2px] focus-within:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-14 px-6 bg-transparent font-bold text-lg focus:outline-none placeholder:opacity-30 pr-14"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors"
                  >
                    {showPass ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  </button>
                </div>
              </fieldset>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-16 bg-black text-white font-black text-xl uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary transition-all disabled:opacity-50 group"
              >
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <>
                    Log in
                    <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </main>

        <footer className="p-8 lg:p-12 border-t border-black flex flex-wrap gap-8 text-xs font-bold uppercase tracking-widest opacity-40">
           <Link href="/terms" className="hover:opacity-100">Terms of Service</Link>
           <Link href="/privacy" className="hover:opacity-100">Privacy Policy</Link>
           <span className="ml-auto">© 2026 AIPowerStacks</span>
        </footer>
      </div>

      {/* Right Side: Visual Image */}
      <div className="hidden lg:block w-[40vw] border-l-2 border-black relative overflow-hidden bg-[#0a0a0a]">
         <div className="absolute inset-0 flex items-center justify-center p-20 text-center text-white">
            <div className="space-y-6">
               <div className="h-32 w-32 mx-auto flex items-center justify-center shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] rounded-[1.2rem]">
                  <BrandMark className="h-32 w-32" />
               </div>
               <h2 className="text-5xl font-black tracking-tight leading-none mt-12">Empowering the next generation of AI builders.</h2>
               <p className="text-xl font-bold opacity-80 max-w-sm mx-auto">Join 10,000+ creators launching their AI stacks on AIPowerStacks.</p>
            </div>
         </div>
      </div>
    </div>
  )
}
