'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BrandMark } from '@/components/common/BrandMark'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          full_name: name,
          username: username.toLowerCase().replace(/[^a-z0-9_]/g, '')
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  const handleGoogle = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  if (success) {
    return (
      <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
        <div className="flex-1 flex flex-col justify-center items-center p-8 text-center max-w-2xl mx-auto">
          <div className="relative mb-8">
            <div className="absolute inset-0 glass-card rounded-full blur-2xl scale-125 opacity-60" />
            <div className="relative h-24 w-24 glass-card rounded-full flex items-center justify-center border border-primary/30 shadow-2xl">
              <span className="text-4xl">✉️</span>
            </div>
          </div>
          <div className="relative mb-12">
            <div className="absolute inset-0 glass-card rounded-3xl blur-xl scale-110 opacity-40" />
            <div className="relative glass-card rounded-3xl p-8 border border-border/50">
              <h2 className="text-4xl font-black tracking-tight mb-4 uppercase italic">Check your email</h2>
              <p className="text-xl font-bold text-muted-foreground max-w-md">
                We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Click it to activate your account and start building.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 glass-card rounded-3xl blur-lg scale-105 opacity-60" />
            <Link
              href="/login"
              className="relative h-16 px-12 btn-primary rounded-3xl shadow-2xl"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Left Side: Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="p-8 lg:p-12 flex items-center justify-between border-b border-border">
          <Link href="/" className="flex items-center gap-3">
             <BrandMark className="h-10 w-10" />
             <span className="text-2xl font-black tracking-[-0.035em] leading-none">
                <span className="text-primary">AI</span>PowerStacks
             </span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-bold underline underline-offset-4 hover:text-primary transition-colors"
          >
            Log in
          </Link>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col justify-center p-8 lg:p-24 max-w-2xl mx-auto w-full">
          <div className="relative mb-12">
            <div className="absolute inset-0 glass-card rounded-3xl blur-2xl scale-110 opacity-40" />
            <div className="relative glass-card rounded-3xl p-8 border border-border/50">
              <h1 className="text-4xl lg:text-6xl font-black tracking-tight mb-4">Join Us</h1>
              <p className="text-lg font-medium text-muted-foreground">Start saving your favorite AI tools today.</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Social Auth */}
            <div className="relative">
              <div className="absolute inset-0 glass-card rounded-3xl blur-lg scale-105 opacity-60" />
              <button
                onClick={handleGoogle}
                className="relative w-full flex items-center justify-center gap-4 py-5 px-6 glass-card border border-border/50 rounded-3xl font-bold text-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Sign up with Google
              </button>
            </div>

            {/* Separator */}
            <div className="relative py-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/30" />
              </div>
              <div className="relative glass-card rounded-full px-6 py-2 border border-border/30">
                <span className="text-sm font-black uppercase tracking-widest text-muted-foreground/70">
                  or with email
                </span>
              </div>
            </div>

            {error && (
              <div className="glass-card border border-destructive/30 bg-destructive/5 text-destructive text-sm font-bold p-5 rounded-2xl flex items-center gap-3 shadow-lg">
                <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-8">
              <fieldset className="group">
                <legend className="w-full mb-4 flex items-center justify-between">
                  <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Full Name</span>
                </legend>
                <div className="relative">
                  <div className="absolute inset-0 glass-card rounded-2xl blur-sm scale-105 opacity-50" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="relative w-full h-16 px-6 glass-card border border-border/50 rounded-2xl font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 placeholder:text-muted-foreground/50 transition-all duration-300"
                  />
                </div>
              </fieldset>

              <fieldset className="group">
                <legend className="w-full mb-4 flex items-center justify-between">
                  <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Username</span>
                </legend>
                <div className="relative">
                  <div className="absolute inset-0 glass-card rounded-2xl blur-sm scale-105 opacity-50" />
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground/50 z-10">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    required
                    className="relative w-full h-16 pl-12 pr-6 glass-card border border-border/50 rounded-2xl font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 placeholder:text-muted-foreground/50 transition-all duration-300"
                  />
                </div>
              </fieldset>

              <fieldset className="group">
                <legend className="w-full mb-4 flex items-center justify-between">
                  <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Email</span>
                </legend>
                <div className="relative">
                  <div className="absolute inset-0 glass-card rounded-2xl blur-sm scale-105 opacity-50" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="relative w-full h-16 px-6 glass-card border border-border/50 rounded-2xl font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 placeholder:text-muted-foreground/50 transition-all duration-300"
                  />
                </div>
              </fieldset>

              <fieldset className="group">
                <legend className="w-full mb-4 flex items-center justify-between">
                  <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Password</span>
                </legend>
                <div className="relative">
                  <div className="absolute inset-0 glass-card rounded-2xl blur-sm scale-105 opacity-50" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                    className="relative w-full h-16 px-6 pr-14 glass-card border border-border/50 rounded-2xl font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 placeholder:text-muted-foreground/50 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    {showPass ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  </button>
                </div>
              </fieldset>

              <div className="relative">
                <div className="absolute inset-0 glass-card rounded-3xl blur-lg scale-105 opacity-60" />
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full h-16 btn-primary rounded-3xl disabled:opacity-50 group shadow-2xl"
                >
                  {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>

        <footer className="p-8 lg:p-12 border-t border-border flex flex-wrap gap-8 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
           <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
           <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
           <span className="ml-auto">© 2026 AIPowerStacks</span>
        </footer>
      </div>

      {/* Right Side: Visual Image */}
      <div className="hidden lg:block w-[40vw] border-l border-border relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
         <div className="absolute inset-0 flex items-center justify-center p-20 text-center">
            <div className="space-y-8">
               <div className="relative">
                 <div className="absolute inset-0 glass-card rounded-3xl blur-2xl scale-125 opacity-30" />
                 <div className="relative h-32 w-32 mx-auto flex items-center justify-center glass-card rounded-3xl border border-border/30 shadow-2xl">
                   <BrandMark className="h-24 w-24" />
                 </div>
               </div>
               <div className="relative">
                 <div className="absolute inset-0 glass-card rounded-3xl blur-xl scale-110 opacity-40" />
                 <div className="relative glass-card rounded-3xl p-8 border border-border/30">
                   <h2 className="text-4xl font-black tracking-tight leading-tight mb-4">Built by creators, for creators.</h2>
                   <p className="text-lg font-semibold text-muted-foreground max-w-sm mx-auto">Discover the perfect stack for your next big AI project.</p>
                 </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
