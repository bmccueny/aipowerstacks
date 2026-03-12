'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Check, Clock, Eye, Globe, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TiptapEditor } from './TiptapEditor'

interface Post {
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

interface BlogPostFormProps {
  post?: Post
}

const AUTOSAVE_KEY = (id?: string) => `blog-draft-${id ?? 'new'}`
const SAVE_DEBOUNCE = 2000

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function readingTime(words: number) {
  return Math.max(1, Math.round(words / 200))
}

export function BlogPostForm({ post }: BlogPostFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [tagInput, setTagInput] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedAt = useRef<Date | null>(null)

  const [form, setForm] = useState(() => {
    const saved = typeof window !== 'undefined'
      ? localStorage.getItem(AUTOSAVE_KEY(post?.id))
      : null
    const parsed = saved ? JSON.parse(saved) : null

    return {
      title: parsed?.title ?? post?.title ?? '',
      slug: parsed?.slug ?? post?.slug ?? '',
      excerpt: parsed?.excerpt ?? post?.excerpt ?? '',
      content: parsed?.content ?? post?.content ?? '',
      cover_image_url: parsed?.cover_image_url ?? post?.cover_image_url ?? '',
      tags: parsed?.tags ?? post?.tags ?? [],
      status: post?.status ?? 'draft',
      is_featured: parsed?.is_featured ?? post?.is_featured ?? false,
      video_embed_url: parsed?.video_embed_url ?? post?.video_embed_url ?? '',
      reading_time_min: String(parsed?.reading_time_min ?? post?.reading_time_min ?? ''),
    }
  })

  const setField = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const autoSave = useCallback((data: typeof form) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaving('saving')
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY(post?.id), JSON.stringify(data))
        savedAt.current = new Date()
        setSaving('saved')
        setTimeout(() => setSaving('idle'), 3000)
      } catch {
        setSaving('idle')
      }
    }, SAVE_DEBOUNCE)
  }, [post?.id])

  useEffect(() => {
    autoSave(form)
  }, [form, autoSave])

  const handleTitleBlur = () => {
    if (!form.slug && form.title) {
      setField('slug', slugify(form.title))
    }
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag)) {
      setField('tags', [...form.tags, tag])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => setField('tags', form.tags.filter((t: string) => t !== tag))

  const submit = async (status: string) => {
    setSaving('saving')
    setError('')

    const payload = {
      ...form,
      status,
      cover_image_url: form.cover_image_url || null,
      video_embed_url: form.video_embed_url || null,
      reading_time_min: form.reading_time_min ? parseInt(form.reading_time_min) : readingTime(wordCount),
    }

    const url = post ? `/api/admin/blog/${post.id}` : '/api/admin/blog'
    const res = await fetch(url, {
      method: post ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setSaving('error')
    } else {
      localStorage.removeItem(AUTOSAVE_KEY(post?.id))
      router.push('/admin/blog')
      router.refresh()
    }
  }

  const statusIcon = {
    idle: null,
    saving: <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />,
    saved: <Check className="h-3.5 w-3.5 text-emerald-600" />,
    error: <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" />,
  }[saving]

  const statusText = {
    idle: null,
    saving: 'Saving draft...',
    saved: `Saved ${savedAt.current ? `at ${savedAt.current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}`,
    error: 'Save failed',
  }[saving]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 glass-card backdrop-blur-xl border-b border-border/50 flex items-center justify-between gap-4 px-4 sm:px-6 h-14">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/blog" className="flex items-center gap-1.5 text-sm font-semibold text-foreground/60 hover:text-foreground transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4" />
            Posts
          </Link>
          <span className="text-foreground/20 hidden sm:block">|</span>
          <span className="text-sm font-semibold truncate hidden sm:block">
            {form.title || 'Untitled'}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {statusText && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              {statusIcon}
              {statusText}
            </span>
          )}
          {post && (
            <Link
              href={`/blog/${post.id}`}
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </Link>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => submit('draft')}
            className="glass-card border border-border/50 text-xs font-bold uppercase tracking-wide hover:scale-105 transition-all duration-300"
          >
            Save draft
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => submit('published')}
            className="gap-1.5 text-xs font-bold uppercase tracking-wide"
          >
            <Globe className="h-3.5 w-3.5" />
            Publish
          </Button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-4 min-w-0">
          <textarea
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Post title"
            rows={2}
            className="w-full text-3xl sm:text-4xl font-black leading-tight bg-transparent resize-none outline-none placeholder:text-foreground/25 border-0 p-0"
          />

          <textarea
            value={form.excerpt}
            onChange={(e) => setField('excerpt', e.target.value)}
            placeholder="Short description (shown in cards and search results)"
            maxLength={300}
            rows={2}
            className="w-full text-base text-muted-foreground bg-transparent resize-none outline-none placeholder:text-foreground/30 border-0 p-0 leading-relaxed"
          />

          <TiptapEditor
            content={form.content}
            onChange={(html) => setField('content', html)}
            onWordCount={setWordCount}
          />

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              ~{readingTime(wordCount)} min read
            </span>
            <span>{wordCount} words</span>
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}
        </div>

        <aside className="space-y-6">
          <div className="gum-card rounded-2xl p-4 space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Status</p>
              <div className="flex gap-2 flex-wrap">
                {(['draft', 'published', 'archived'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setField('status', s)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wide border rounded-2xl transition-all duration-300 ${
                      form.status === s
                        ? 'btn-primary'
                        : 'glass-card border-border/30 hover:border-border/50 hover:scale-105'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer group">
              <div
                onClick={() => setField('is_featured', !form.is_featured)}
                className={`h-6 w-10 rounded-full border-2 border-border/50 transition-all duration-300 relative cursor-pointer ${form.is_featured ? 'bg-primary border-primary' : 'glass-card'}`}
              >
                <span className={`absolute top-0.5 h-3 w-3 rounded-full transition-all ${form.is_featured ? 'bg-background left-[18px]' : 'bg-foreground/30 left-0.5'}`} />
              </div>
              <span className="text-sm font-medium">Featured post</span>
            </label>
          </div>

          <div className="gum-card rounded-2xl p-4 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Cover Image URL</label>
                <button
                  type="button"
                  onClick={() => {
                    const url = prompt('Enter a tool website URL to generate a screenshot:')
                    if (url) {
                      const clean = url.replace(/^(https?:\/\/)?(www\.)?/, '')
                      setField('cover_image_url', `https://image.thum.io/get/width/1200/crop/650/noanimate/https://${clean}`)
                    }
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                >
                  Screenshot Tool
                </button>
              </div>
              <Input
                value={form.cover_image_url}
                onChange={(e) => setField('cover_image_url', e.target.value)}
                type="url"
                placeholder="https://..."
                className="text-sm"
              />
              {form.cover_image_url && (
                <div className="mt-2 relative h-28 rounded-2xl overflow-hidden glass-card border border-border/30">
                  <Image
                    src={form.cover_image_url}
                    alt="Cover preview"
                    fill
                    unoptimized
                    className="object-cover"
                    onError={() => {}}
                  />
                  <button
                    type="button"
                    onClick={() => setField('cover_image_url', '')}
                    className="absolute top-2 right-2 p-2 glass-card border border-border/30 rounded-2xl hover:scale-105 transition-all duration-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Slug</label>
              <Input
                value={form.slug}
                onChange={(e) => setField('slug', e.target.value)}
                placeholder="post-slug"
                className="text-sm font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.tags.map((tag: string) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-foreground/40 hover:text-foreground transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag..."
                  className="text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag} className="shrink-0 glass-card border border-border/50 hover:scale-105 transition-all duration-300">
                  Add
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                Reading time (min)
              </label>
              <Input
                value={form.reading_time_min}
                onChange={(e) => setField('reading_time_min', e.target.value)}
                type="number"
                min="1"
                placeholder={`~${readingTime(wordCount)} (auto)`}
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Video Embed URL</label>
              <Input
                value={form.video_embed_url}
                onChange={(e) => setField('video_embed_url', e.target.value)}
                type="url"
                placeholder="https://youtube.com/..."
                className="text-sm"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
