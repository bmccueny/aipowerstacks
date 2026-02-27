'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail } from 'lucide-react'

export function NewsletterBanner({ source = 'footer' }: { source?: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

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
      <div className="glass-card rounded-xl p-6 text-center">
        <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
        <p className="font-semibold">You&apos;re subscribed!</p>
        <p className="text-sm text-muted-foreground mt-1">We&apos;ll keep you updated on the latest AI tools.</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <Mail className="h-5 w-5 text-primary shrink-0" />
        <div>
          <p className="font-semibold text-sm">Stay up to date</p>
          <p className="text-xs text-muted-foreground">Get weekly AI tool discoveries in your inbox.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="bg-white/5 border-white/10 flex-1"
        />
        <Button type="submit" disabled={loading} size="sm">
          {loading ? '...' : 'Subscribe'}
        </Button>
      </form>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  )
}
