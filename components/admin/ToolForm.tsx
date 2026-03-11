'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { INTEGRATION_OPTIONS, PRICING_MODELS, TEAM_SIZE_OPTIONS, USE_CASE_OPTIONS, MODEL_PROVIDER_OPTIONS } from '@/lib/constants'
import { DeleteToolButton } from './DeleteToolButton'

interface Category { id: string; name: string }

interface ToolFormProps {
  categories: Category[]
  tool?: {
    id: string
    name: string
    slug: string
    tagline: string
    description: string
    website_url: string
    logo_url: string | null
    category_id: string
    pricing_model: string
    pricing_details: string | null
    use_case: string | null
    team_size: string | null
    integrations: string[] | null
    status: string
    is_verified: boolean
    is_featured: boolean
    is_supertools: boolean
    is_editors_pick: boolean
    model_provider: string | null
    is_api_wrapper: boolean
    wrapper_details: string | null
  }
}

export function ToolForm({ categories, tool }: ToolFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: tool?.name ?? '',
    slug: tool?.slug ?? '',
    tagline: tool?.tagline ?? '',
    description: tool?.description ?? '',
    website_url: tool?.website_url ?? '',
    logo_url: tool?.logo_url ?? '',
    category_id: tool?.category_id ?? '',
    pricing_model: tool?.pricing_model ?? 'free',
    pricing_details: tool?.pricing_details ?? '',
    use_case: tool?.use_case ?? '',
    team_size: tool?.team_size ?? '',
    integrations: (tool?.integrations ?? []).join(', '),
    status: tool?.status ?? 'published',
    is_verified: tool?.is_verified ?? false,
    is_featured: tool?.is_featured ?? false,
    is_supertools: tool?.is_supertools ?? false,
    is_editors_pick: tool?.is_editors_pick ?? false,
    model_provider: tool?.model_provider ?? '',
    is_api_wrapper: tool?.is_api_wrapper ?? false,
    wrapper_details: tool?.wrapper_details ?? '',
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const toggle = (k: keyof typeof form) => () =>
    setForm((prev) => ({ ...prev, [k]: !prev[k] }))

  const autoSlug = () => {
    setForm((prev) => ({
      ...prev,
      slug: prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const url = tool ? `/api/admin/tools/${tool.id}` : '/api/admin/tools'
    const method = tool ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        logo_url: form.logo_url || null,
        pricing_details: form.pricing_details || null,
        use_case: form.use_case || null,
        team_size: form.team_size || null,
        integrations: form.integrations
          ? form.integrations.split(',').map((item) => item.trim()).filter(Boolean)
          : null,
        model_provider: form.model_provider || null,
        wrapper_details: form.wrapper_details || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
    } else {
      router.push('/admin/tools')
      router.refresh()
    }
  }

  const inputCls = 'glass-card border-border/30 focus:ring-2 focus:ring-primary/50'

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Tool Name *</label>
          <Input value={form.name} onChange={set('name')} onBlur={!tool ? autoSlug : undefined} required className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Slug *</label>
          <Input value={form.slug} onChange={set('slug')} required className={inputCls} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Tagline *</label>
        <Input value={form.tagline} onChange={set('tagline')} required maxLength={150} className={inputCls} />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Description *</label>
        <textarea value={form.description} onChange={set('description')} required maxLength={5000}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm resize-none h-32 focus:outline-none focus:border-primary/50" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Website URL *</label>
          <Input value={form.website_url} onChange={set('website_url')} type="url" required className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Logo URL</label>
          <Input value={form.logo_url} onChange={set('logo_url')} type="url" className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Category *</label>
          <select value={form.category_id} onChange={set('category_id')} required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50">
            <option value="">Select...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Pricing</label>
          <select value={form.pricing_model} onChange={set('pricing_model')}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50">
            {PRICING_MODELS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Status</label>
          <select value={form.status} onChange={set('status')}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50">
            {['published', 'pending', 'rejected', 'archived'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Pricing Details</label>
        <Input value={form.pricing_details} onChange={set('pricing_details')} placeholder="e.g. Free up to 10 users" className={inputCls} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Primary Use Case</label>
          <select value={form.use_case} onChange={set('use_case')}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50">
            <option value="">Select use case...</option>
            {USE_CASE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Team Size</label>
          <select value={form.team_size} onChange={set('team_size')}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50">
            <option value="">Select team size...</option>
            {TEAM_SIZE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Integrations (comma-separated)</label>
        <Input
          value={form.integrations}
          onChange={set('integrations')}
          placeholder={INTEGRATION_OPTIONS.map((item) => item.value).slice(0, 4).join(', ')}
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Model Provider</label>
          <select value={form.model_provider} onChange={set('model_provider')}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50">
            <option value="">None / Unknown</option>
            {MODEL_PROVIDER_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Wrapper Details</label>
          <Input value={form.wrapper_details} onChange={set('wrapper_details')} placeholder="e.g. Uses GPT-4 Turbo + Whisper" className={inputCls} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {([
          ['is_verified', 'Verified'],
          ['is_featured', 'Featured'],
          ['is_supertools', 'Super Tool'],
          ['is_editors_pick', "Editor's Pick"],
          ['is_api_wrapper', 'API Wrapper'],
        ] as const).map(([k, label]) => (
          <label key={k} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form[k] as boolean} onChange={toggle(k)} className="rounded" />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between pt-6 border-t border-white/5">
        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : tool ? 'Update Tool' : 'Create Tool'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push('/admin/tools')}>Cancel</Button>
        </div>
        {tool && (
          <DeleteToolButton toolId={tool.id} toolName={tool.name} />
        )}
      </div>
    </form>
  )
}
