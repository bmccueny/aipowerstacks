'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PRICING_MODELS, MODEL_PROVIDER_OPTIONS } from '@/lib/constants'
import { useLiquidGlass } from '@/hooks/useLiquidGlass'

interface Category { id: string; name: string }

export function SubmitToolForm({
  categories,
  initialValues,
  mode,
}: {
  categories: Category[]
  initialValues?: Partial<{
    name: string
    website_url: string
    tagline: string
    description: string
    category_id: string
    pricing_model: string
    logo_url: string
    submitter_email: string
    notes: string
    model_provider: string
  }>
  mode?: 'submit' | 'claim' | 'suggest-edit'
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: initialValues?.name ?? '',
    website_url: initialValues?.website_url ?? '',
    tagline: initialValues?.tagline ?? '',
    description: initialValues?.description ?? '',
    category_id: initialValues?.category_id ?? '',
    pricing_model: initialValues?.pricing_model ?? '',
    logo_url: initialValues?.logo_url ?? '',
    submitter_email: initialValues?.submitter_email ?? '',
    notes: initialValues?.notes ?? '',
    model_provider: initialValues?.model_provider ?? '',
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (!res.ok) {
      if (res.status === 401 && typeof window !== 'undefined') {
        const redirectTo = `${window.location.pathname}${window.location.search}`
        window.location.href = `/login?redirectTo=${encodeURIComponent(redirectTo)}`
        return
      }
      setError(typeof data.error === 'string' ? data.error : 'Validation failed. Check all required fields.')
      setLoading(false)
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="glass-card rounded-xl p-10 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-3">Submission Received!</h2>
        <p className="text-muted-foreground mb-6">
          Thanks for submitting. Our team will review your tool and get back to you.
        </p>
        <Button onClick={() => router.push('/tools')}>Browse Tools</Button>
      </div>
    )
  }

  const glassRef = useLiquidGlass<HTMLFormElement>({ radius: 12 })

  return (
    <form ref={glassRef} onSubmit={handleSubmit} className="liquid-glass glass-card rounded-xl p-6 space-y-5 border border-white/15 shadow-lg">
      {mode && mode !== 'submit' && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-muted-foreground">
          {mode === 'claim'
            ? 'Claim request mode: Tell us why you should manage this listing.'
            : 'Suggest edit mode: Share what should be corrected on this listing.'}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Tool Name *</label>
          <Input value={form.name} onChange={set('name')} placeholder="e.g. ChatGPT" required className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Website URL *</label>
          <Input value={form.website_url} onChange={set('website_url')} placeholder="https://..." type="url" required className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary" />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Tagline *</label>
        <Input value={form.tagline} onChange={set('tagline')} placeholder="One-line description (max 150 chars)" required maxLength={150} className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary" />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Description *</label>
        <textarea
          value={form.description}
          onChange={set('description')}
          placeholder="Describe what the tool does, its key features, and who it's for..."
          required
          maxLength={2000}
          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl px-4 py-3 text-sm resize-none h-32 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Category</label>
          <select value={form.category_id} onChange={set('category_id')} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary">
            <option value="">Select category...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Pricing Model</label>
          <select value={form.pricing_model} onChange={set('pricing_model')} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary">
            <option value="">Select pricing...</option>
            {PRICING_MODELS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Underlying AI Model (optional)</label>
        <select value={form.model_provider} onChange={set('model_provider')} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary">
          <option value="">Not sure / Proprietary</option>
          {MODEL_PROVIDER_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <p className="text-[11px] text-muted-foreground mt-1">If this tool is built on top of another AI model, select it here.</p>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Logo URL</label>
        <Input value={form.logo_url} onChange={set('logo_url')} placeholder="https://... (direct image link)" type="url" className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary" />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Your Email</label>
        <Input value={form.submitter_email} onChange={set('submitter_email')} placeholder="For submission updates (optional)" type="email" className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary" />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Additional Notes</label>
        <textarea
          value={form.notes}
          onChange={set('notes')}
          placeholder="Anything else you'd like us to know..."
          maxLength={500}
          className="w-full glass-card border border-border/50 rounded-2xl px-4 py-3 text-sm resize-none h-24 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="w-full relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm" />
        <div className="absolute inset-0 glass-card border border-primary/30" />
        <span className="relative flex items-center justify-center gap-2 font-semibold text-gray-900 dark:text-white">
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin"></div>
              Submitting...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <span>Submit Tool for Review</span>
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </>
          )}
        </span>
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By submitting, you confirm this tool is real and not spam.
      </p>
    </form>
  )
}
