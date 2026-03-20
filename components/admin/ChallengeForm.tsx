'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function ChallengeForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    prompt: '',
    starts_at: '',
    ends_at: '',
  })

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.prompt || !form.starts_at || !form.ends_at) {
      toast.error('Title, prompt, and dates are required.')
      return
    }
    setLoading(true)
    const res = await fetch('/api/admin/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('Challenge created!')
      router.push('/admin/challenges')
      router.refresh()
    } else {
      const { error } = await res.json()
      toast.error(error || 'Failed to create challenge')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card/50 border border-border/50 rounded-lg p-4 sm:p-6 lg:p-8 max-w-2xl space-y-5">
      <div>
        <label className="text-sm font-semibold block mb-1.5">Title</label>
        <Input placeholder="e.g. Best Writing Stack" value={form.title} onChange={set('title')} required />
      </div>
      <div>
        <label className="text-sm font-semibold block mb-1.5">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
        <textarea
          value={form.description}
          onChange={set('description')}
          rows={2}
          placeholder="Short context for participants..."
          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
        />
      </div>
      <div>
        <label className="text-sm font-semibold block mb-1.5">Challenge Prompt</label>
        <textarea
          value={form.prompt}
          onChange={set('prompt')}
          rows={3}
          placeholder="e.g. Build the ultimate AI stack for a solo content creator..."
          required
          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold block mb-1.5">Starts at</label>
          <Input type="datetime-local" value={form.starts_at} onChange={set('starts_at')} required />
        </div>
        <div>
          <label className="text-sm font-semibold block mb-1.5">Ends at</label>
          <Input type="datetime-local" value={form.ends_at} onChange={set('ends_at')} required />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Challenge'}
      </Button>
    </form>
  )
}
