'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail } from 'lucide-react'
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
  }

  if (done) {
    return (
      <div className={cn(
        'rounded-2xl p-6 text-center',
        isDark ? 'glass-card border border-border/30' : 'glass-card'
      )}>
        <Mail className={cn('h-8 w-8 mx-auto mb-2', isDark ? 'text-white' : 'text-primary')} />
        <p className="font-semibold">Welcome aboard.</p>
        <p className={cn('text-sm mt-1', isDark ? 'text-white/75' : 'text-muted-foreground')}>
          Your first stack report drops this Friday.
        </p>
      </div>
    )
  }

  return (
    <div className={cn(
      'rounded-2xl p-6 border',
      isDark
        ? 'bg-gray-800 border-gray-700'
        : 'bg-gray-50 border-gray-200'
    )}>
      <div className="flex items-center gap-3 mb-4">
        <Mail className="h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className={cn(
            'font-semibold text-sm',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            5 vetted AI tools, every Friday
          </p>
          <p className={cn(
            'text-xs mt-1',
            isDark ? 'text-gray-300' : 'text-gray-600'
          )}>
            Tested and ranked so you skip the hype. Join 2,000+ readers.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className={cn(
            'flex-1 focus:ring-2 focus:ring-primary focus:border-primary',
            isDark
              ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'
          )}
        />
        <Button
          type="submit"
          disabled={loading}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
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
