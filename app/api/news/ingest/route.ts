import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_ITEMS_PER_REQUEST = 50

const incomingNewsItemSchema = z
  .object({
    guid: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1),
    url: z.string().url().optional(),
    link: z.string().url().optional(),
    summary: z.string().optional(),
    content: z.string().optional(),
    contentSnippet: z.string().optional(),
    source_name: z.string().trim().min(1).optional(),
    sourceName: z.string().trim().min(1).optional(),
    source_url: z.string().url().optional(),
    sourceUrl: z.string().url().optional(),
    image_url: z.string().url().optional(),
    imageUrl: z.string().url().optional(),
    published_at: z.string().optional(),
    publishedAt: z.string().optional(),
    isoDate: z.string().optional(),
    pubDate: z.string().optional(),
  })
  .passthrough()
  .refine((item) => Boolean(item.url || item.link), {
    message: 'Each news item must include url or link',
  })

const incomingNewsPayloadSchema = z.object({
  items: z.array(incomingNewsItemSchema).min(1).max(MAX_ITEMS_PER_REQUEST),
  source_name: z.string().trim().min(1).optional(),
  sourceName: z.string().trim().min(1).optional(),
  source_url: z.string().url().optional(),
  sourceUrl: z.string().url().optional(),
  sync_to_blog: z.boolean().optional(),
  syncToBlog: z.boolean().optional(),
  blog_tags: z.array(z.string().trim().min(1)).max(20).optional(),
  blogTags: z.array(z.string().trim().min(1)).max(20).optional(),
})

function getRequestSecret(request: Request) {
  const bearer = request.headers.get('authorization')
  if (bearer?.startsWith('Bearer ')) return bearer.slice(7).trim()
  return request.headers.get('x-webhook-secret')?.trim() ?? ''
}

function normalizeSummary(item: z.infer<typeof incomingNewsItemSchema>) {
  const raw = item.summary ?? item.contentSnippet ?? item.content
  if (!raw) return null
  const cleaned = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned.length > 400 ? `${cleaned.slice(0, 397)}...` : cleaned
}

function normalizePublishedAt(item: z.infer<typeof incomingNewsItemSchema>) {
  const candidate = item.published_at ?? item.publishedAt ?? item.isoDate ?? item.pubDate
  if (!candidate) return new Date().toISOString()
  const parsed = new Date(candidate)
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildBlogSlug(title: string, guid: string) {
  const base = slugify(title).slice(0, 180) || 'ai-news'
  const suffix = slugify(guid).slice(0, 32)
  return (suffix ? `${base}-${suffix}` : base).slice(0, 220)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildBlogContent(row: {
  title: string
  summary: string | null
  image_url: string | null
  url: string
  source_name: string
}) {
  const summaryBlocks = (row.summary ?? '')
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${escapeHtml(part)}</p>`)

  const imageBlock = row.image_url
    ? `<p><img src="${escapeHtml(row.image_url)}" alt="${escapeHtml(row.title)}" /></p>`
    : ''

  return [
    imageBlock,
    ...summaryBlocks,
    `<p><strong>Source:</strong> ${escapeHtml(row.source_name)}</p>`,
    `<p><a href="${escapeHtml(row.url)}" target="_blank" rel="noopener noreferrer">Read the original article</a></p>`,
  ]
    .filter(Boolean)
    .join('\n')
}

async function resolveAutomationAuthorId(admin: ReturnType<typeof createAdminClient>) {
  const configured = process.env.BLOG_AUTOMATION_AUTHOR_ID?.trim()
  if (configured) return configured

  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .order('created_at', { ascending: true })
    .limit(1)

  const firstAdmin = (data ?? [])[0] as { id: string } | undefined
  return firstAdmin?.id ?? null
}

export async function POST(request: Request) {
  const expectedSecret = process.env.N8N_WEBHOOK_SECRET
  if (!expectedSecret) {
    return NextResponse.json({ error: 'Server is missing N8N_WEBHOOK_SECRET' }, { status: 500 })
  }

  const providedSecret = getRequestSecret(request)
  if (!providedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const normalizedBody = Array.isArray(rawBody)
    ? { items: rawBody }
    : (typeof rawBody === 'object' && rawBody !== null && !('items' in rawBody))
      ? { items: [rawBody] }
      : rawBody
  const parsed = incomingNewsPayloadSchema.safeParse(normalizedBody)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const sourceNameDefault = parsed.data.source_name ?? parsed.data.sourceName ?? 'RSS Feed'
  const sourceUrlDefault = parsed.data.source_url ?? parsed.data.sourceUrl ?? null
  const syncToBlog = parsed.data.sync_to_blog ?? parsed.data.syncToBlog ?? false
  const blogTags = (parsed.data.blog_tags ?? parsed.data.blogTags ?? []).map((tag) => tag.trim()).filter(Boolean)

  const rows = parsed.data.items.map((item) => {
    const url = item.url ?? item.link ?? ''
    const guid = item.guid ?? url
    return {
      guid,
      title: item.title.trim(),
      url,
      summary: normalizeSummary(item),
      source_name: item.source_name ?? item.sourceName ?? sourceNameDefault,
      source_url: item.source_url ?? item.sourceUrl ?? sourceUrlDefault,
      image_url: item.image_url ?? item.imageUrl ?? null,
      published_at: normalizePublishedAt(item),
      updated_at: new Date().toISOString(),
    }
  })

  const admin = createAdminClient()
  const { error } = await admin
    .from('ai_news')
    .upsert(rows, { onConflict: 'guid', ignoreDuplicates: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  let blogUpserted = 0
  if (syncToBlog) {
    const authorId = await resolveAutomationAuthorId(admin)
    if (!authorId) {
      return NextResponse.json(
        { error: 'No admin profile available for blog automation. Set BLOG_AUTOMATION_AUTHOR_ID.' },
        { status: 500 },
      )
    }

    const now = new Date().toISOString()
    const blogRows = rows.map((row) => {
      const summary = row.summary ?? row.title
      const excerpt = summary.length > 300 ? `${summary.slice(0, 297)}...` : summary
      const tags = Array.from(new Set(['AI News', row.source_name, ...blogTags])).slice(0, 10)

      return {
        title: row.title,
        slug: buildBlogSlug(row.title, row.guid),
        excerpt,
        content: buildBlogContent(row),
        cover_image_url: row.image_url,
        author_id: authorId,
        tags,
        status: 'published' as const,
        is_featured: false,
        reading_time_min: Math.max(1, Math.ceil(summary.split(/\s+/).filter(Boolean).length / 180)),
        published_at: row.published_at,
        updated_at: now,
      }
    })

    const { error: blogError } = await admin
      .from('blog_posts')
      .upsert(blogRows, { onConflict: 'slug', ignoreDuplicates: false })

    if (blogError) {
      return NextResponse.json({ error: blogError.message }, { status: 400 })
    }

    blogUpserted = blogRows.length
  }

  return NextResponse.json({ success: true, upserted: rows.length, blog_upserted: blogUpserted })
}
