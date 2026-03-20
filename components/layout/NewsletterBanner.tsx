'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NewsletterBanner({
  source = 'footer',
  tone = 'light',
}: {
  source?: string
  tone?: 'light' | 'dark'
}) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const isDark = tone === 'dark'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })

      if (res.ok) {
        setDone(true)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong')
        setLoading(false)
      }
    } catch (err) {
      setError('Failed to subscribe. Please try again.')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className={cn(
        'rounded-2xl p-6 text-center',
        isDark ? 'glass-card border border-border/30' : 'glass-card'
      )}>
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
          <Zap className={cn('h-6 w-6', isDark ? 'text-white' : 'text-primary')} />
        </div>
        <p className="font-bold text-lg">You're in.</p>
        <p className={cn('text-sm mt-1', isDark ? 'text-white/75' : 'text-muted-foreground')}>
          See you Friday.
        </p>
      </div>
    )
  }

  return (
    <div className={cn(
      'glass-card rounded-2xl p-5',
      isDark ? 'bg-zinc-900/80' : 'bg-white/80'
    )}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className={cn(
            'flex-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary h-11',
            isDark
              ? 'bg-gray-800 border-gray-600 text-white placeholder:text-gray-400'
              : 'bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500'
          )}
        />
        <Button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white px-5 h-11 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Subscribe'}
        </Button>
      </form>
      {error && <p className={cn(
        'text-xs mt-2',
        isDark ? 'text-red-400' : 'text-red-600'
      )}>{error}</p>}
    </div>
  )
}
