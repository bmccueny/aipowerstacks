'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BrandMark } from '@/components/common/BrandMark'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-8">
      <div className="text-center space-y-3">
        <Link href="/" className="inline-block">
          <BrandMark className="h-10 w-auto mx-auto" />
        </Link>
        <h1 className="text-2xl font-black tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          {sent
            ? "Check your email for a reset link."
            : "Enter your email and we'll send you a reset link."}
        </p>
      </div>

      {sent ? (
        <div className="glass-card rounded-2xl p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            If an account exists for <strong>{email}</strong>, you will receive a password reset email shortly.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleReset} className="glass-card rounded-2xl p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="relative w-full h-12 px-5 glass-card border border-white/10 rounded-xl font-medium text-base focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/40 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
          </button>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
