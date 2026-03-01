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
        'rounded-xl p-6 text-center',
        isDark ? 'border border-white/20 bg-white/5 text-white' : 'glass-card'
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
      'rounded-xl p-6',
      isDark ? 'border border-white/20 bg-white/5 text-white' : 'glass-card'
    )}>
      <div className="flex items-center gap-3 mb-3">
        <Mail className={cn('h-5 w-5 shrink-0', isDark ? 'text-white' : 'text-primary')} />
        <div>
          <p className="font-semibold text-sm">5 vetted AI tools, every Friday</p>
          <p className={cn('text-xs', isDark ? 'text-white/75' : 'text-muted-foreground')}>
            Tested and ranked so you skip the hype. Join 2,000+ readers.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className={cn(
            'flex-1',
            isDark
              ? 'bg-black/30 border-white/30 text-white placeholder:text-white/50 focus:border-white/60'
              : 'bg-background border-black/20'
          )}
        />
        <Button
          type="submit"
          disabled={loading}
          size="sm"
          variant={isDark ? 'outline' : 'default'}
          className={cn(
            isDark ? 'border-white/35 bg-white/10 text-white hover:bg-white hover:text-black' : ''
          )}
        >
          {loading ? '...' : 'Get the List'}
        </Button>
      </form>
      {error && <p className={cn('text-xs mt-2', isDark ? 'text-red-300' : 'text-destructive')}>{error}</p>}
    </div>
  )
}
