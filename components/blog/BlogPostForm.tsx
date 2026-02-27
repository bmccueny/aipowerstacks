'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TiptapEditor } from './TiptapEditor'

interface BlogPostFormProps {
  post?: {
    id: string
    title: string
    slug: string
    excerpt: string
    content: string
    cover_image_url: string | null
    tags: string[]
    status: string
    is_featured: boolean
    video_embed_url: string | null
    reading_time_min: number | null
  }
}

export function BlogPostForm({ post }: BlogPostFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: post?.title ?? '',
    slug: post?.slug ?? '',
    excerpt: post?.excerpt ?? '',
    content: post?.content ?? '',
    cover_image_url: post?.cover_image_url ?? '',
    tags: post?.tags?.join(', ') ?? '',
    status: post?.status ?? 'draft',
    is_featured: post?.is_featured ?? false,
    video_embed_url: post?.video_embed_url ?? '',
    reading_time_min: String(post?.reading_time_min ?? ''),
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const autoSlug = () => {
    if (!form.slug && form.title) {
      setForm((prev) => ({
        ...prev,
        slug: prev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      cover_image_url: form.cover_image_url || null,
      video_embed_url: form.video_embed_url || null,
      reading_time_min: form.reading_time_min ? parseInt(form.reading_time_min) : null,
    }

    const url = post ? `/api/admin/blog/${post.id}` : '/api/admin/blog'
    const method = post ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
    } else {
      router.push('/admin/blog')
      router.refresh()
    }
  }

  const inputCls = 'bg-white/5 border-white/10'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Title *</label>
            <Input value={form.title} onChange={set('title')} onBlur={autoSlug} required className={inputCls} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Slug *</label>
            <Input value={form.slug} onChange={set('slug')} required className={inputCls} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Excerpt *</label>
            <textarea value={form.excerpt} onChange={set('excerpt')} required maxLength={300}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:border-primary/50" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Content *</label>
            <TiptapEditor
              content={form.content}
              onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Status</label>
            <select value={form.status} onChange={set('status')}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50">
              {['draft', 'published', 'archived'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Cover Image URL</label>
            <Input value={form.cover_image_url} onChange={set('cover_image_url')} type="url" placeholder="https://..." className={inputCls} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Tags (comma separated)</label>
            <Input value={form.tags} onChange={set('tags')} placeholder="AI, tools, guide" className={inputCls} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Reading Time (min)</label>
            <Input value={form.reading_time_min} onChange={set('reading_time_min')} type="number" min="1" placeholder="5" className={inputCls} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Video Embed URL</label>
            <Input value={form.video_embed_url} onChange={set('video_embed_url')} type="url" placeholder="https://youtube.com/..." className={inputCls} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_featured} onChange={() => setForm((p) => ({ ...p, is_featured: !p.is_featured }))} />
            <span className="text-sm">Featured Post</span>
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : post ? 'Update Post' : 'Create Post'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/blog')}>Cancel</Button>
      </div>
    </form>
  )
}
