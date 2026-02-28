'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight } from 'lucide-react'

export function FeaturedCheckout() {
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const toolSlug = slug.trim().toLowerCase().replace(/^\/+|\/+$/g, '').split('/').pop() ?? slug

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolSlug }),
    })

    if (res.ok) {
      const { url } = await res.json()
      window.location.href = url
    } else {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <Input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="your-tool-slug"
        required
        className="flex-1 bg-background border-black/30 text-center sm:text-left"
      />
      <Button type="submit" disabled={loading} className="gap-2 shrink-0">
        {loading ? 'Redirecting...' : 'Get featured'}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </Button>
      {error && <p className="text-xs text-destructive col-span-2 text-center w-full">{error}</p>}
    </form>
  )
}
