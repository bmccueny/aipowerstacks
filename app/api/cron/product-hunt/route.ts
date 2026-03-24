import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Product Hunt AI Tool Discovery ──────────────────────────────────────────
// Discovers new AI tools from Product Hunt's GraphQL API daily,
// enriches them with Grok, and auto-publishes to the directory.
//
// Requires PRODUCT_HUNT_ACCESS_TOKEN env var.
// Get one at: https://www.producthunt.com/v2/oauth/applications

const XAI_BASE_URL = 'https://api.x.ai/v1'
const JINA_BASE = 'https://r.jina.ai'
const MAX_TOOLS_PER_RUN = 5

const AI_KEYWORDS = [
  'ai', 'artificial intelligence', 'machine learning', 'llm', 'gpt',
  'chatbot', 'copilot', 'neural', 'deep learning', 'nlp',
  'text-to', 'speech-to', 'image generation', 'generative',
  'automation', 'agent', 'transformer', 'embedding', 'rag',
  'openai', 'anthropic', 'claude', 'gemini', 'diffusion',
  'computer vision', 'ocr', 'transcription', 'summariz',
]

// Map PH topics/keywords to our category slugs
const KEYWORD_TO_CATEGORY: Record<string, string> = {
  'chatbot': 'ai-chat', 'chat': 'ai-chat', 'assistant': 'ai-chat',
  'llm': 'ai-chat', 'gpt': 'ai-chat', 'conversational': 'ai-chat',
  'agent': 'ai-chat',
  'image': 'image-generation', 'art': 'image-generation', 'design': 'design',
  'video': 'video', 'animation': 'video',
  'audio': 'audio', 'music': 'audio', 'voice': 'voice',
  'speech': 'voice', 'transcri': 'voice',
  'code': 'coding', 'developer': 'coding', 'programming': 'coding', 'ide': 'coding',
  'writing': 'writing', 'copywriting': 'writing', 'content': 'writing',
  'marketing': 'business', 'sales': 'business', 'crm': 'business',
  'productivity': 'productivity', 'workflow': 'automation', 'automat': 'automation',
  'search': 'search', 'research': 'research', 'data': 'data-analytics',
  'analytics': 'data-analytics',
  'email': 'email', 'seo': 'seo', 'social media': 'social-media',
  'education': 'education', 'learning': 'education',
  'customer support': 'customer-support', 'helpdesk': 'customer-support',
  'translation': 'translation', 'summar': 'summarization',
  '3d': '3d-animation', 'avatar': 'avatars',
  'health': 'healthcare', 'medical': 'healthcare',
  'finance': 'finance', 'trading': 'finance',
}

const DEFAULT_CATEGORY_SLUG = 'productivity'

type PHPost = {
  name: string
  tagline: string
  description: string
  website: string
  votesCount: number
  thumbnail: { url: string } | null
  topics: { edges: Array<{ node: { name: string } }> }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

function isAIRelated(post: PHPost): boolean {
  const text = `${post.name} ${post.tagline} ${post.description}`.toLowerCase()
  return AI_KEYWORDS.some((kw) => text.includes(kw))
}

function inferCategory(post: PHPost): string {
  const text = `${post.name} ${post.tagline} ${post.description}`.toLowerCase()
  const topicNames = post.topics?.edges?.map((e) => e.node.name.toLowerCase()) ?? []
  const allText = [...topicNames, text].join(' ')

  const votes: Record<string, number> = {}
  for (const [keyword, catSlug] of Object.entries(KEYWORD_TO_CATEGORY)) {
    if (allText.includes(keyword)) {
      votes[catSlug] = (votes[catSlug] || 0) + 1
    }
  }

  const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] ?? DEFAULT_CATEGORY_SLUG
}

async function scrapeWebsite(url: string): Promise<string | null> {
  try {
    const res = await fetch(`${JINA_BASE}/${url}`, {
      headers: { Accept: 'text/plain' },
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) return null
    const text = await res.text()
    return text.slice(0, 4000)
  } catch {
    return null
  }
}

async function enrichWithGrok(
  post: PHPost,
  siteContent: string | null,
): Promise<{
  tagline: string
  description: string
  pricing_model: string
  has_api: boolean
  has_mobile_app: boolean
  is_open_source: boolean
  trains_on_data: boolean
  has_sso: boolean
} | null> {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) return null

  const prompt = `You are enriching an AI tool listing for a curated directory. Be accurate and concise.

## Tool info
Name: ${post.name}
URL: ${post.website}
Product Hunt tagline: ${post.tagline}
Product Hunt description: ${post.description}
Product Hunt votes: ${post.votesCount}

## Website content (first 4000 chars)
${siteContent ?? '(not available)'}

Return ONLY a valid JSON object — no markdown fences, no explanation:
{
  "tagline": "One punchy sentence, max 150 chars. No hype words like 'revolutionary' or 'game-changing'.",
  "description": "2-3 clear sentences about what it does and who it's for. Max 500 chars.",
  "pricing_model": "free" | "freemium" | "paid" | "trial" | "contact",
  "has_api": true | false,
  "has_mobile_app": true | false,
  "is_open_source": true | false,
  "trains_on_data": true | false,
  "has_sso": true | false
}`

  try {
    const res = await fetch(`${XAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini-fast',
        max_tokens: 500,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) return null

    const data = await res.json()
    const raw = (data.choices?.[0]?.message?.content ?? '')
      .trim()
      .replace(/^```json?\s*/i, '')
      .replace(/\s*```$/, '')

    const parsed = JSON.parse(raw)
    const validPricing = ['free', 'freemium', 'paid', 'trial', 'contact']
    if (!validPricing.includes(parsed.pricing_model)) parsed.pricing_model = 'freemium'
    parsed.tagline = (parsed.tagline ?? '').slice(0, 150)
    parsed.description = (parsed.description ?? '').slice(0, 500)

    return parsed
  } catch {
    return null
  }
}

export const maxDuration = 120

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const phToken = process.env.PRODUCT_HUNT_ACCESS_TOKEN
  if (!phToken) {
    return NextResponse.json({ error: 'PRODUCT_HUNT_ACCESS_TOKEN not set' }, { status: 500 })
  }

  const admin = createAdminClient()

  // 1. Load categories
  const { data: categories } = await admin.from('categories').select('id, slug')
  if (!categories) {
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 })
  }
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]))

  // 2. Load existing tool domains for dedup
  const { data: existingTools } = await admin.from('tools').select('website_url, slug')
  const existingDomains = new Set<string>()
  const existingSlugs = new Set<string>()
  for (const t of existingTools ?? []) {
    if (t.website_url) {
      try { existingDomains.add(new URL(t.website_url).hostname.replace('www.', '')) } catch {}
    }
    if (t.slug) existingSlugs.add(t.slug)
  }

  // 3. Fetch recent AI posts from Product Hunt
  const query = `
    query($n: Int!) {
      posts(first: $n, order: NEWEST, topic: "artificial-intelligence") {
        edges {
          node {
            name
            tagline
            description
            website
            votesCount
            thumbnail { url }
            topics { edges { node { name } } }
          }
        }
      }
    }
  `

  let posts: PHPost[] = []
  try {
    const res = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${phToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { n: 30 } }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `PH API returned ${res.status}` }, { status: 502 })
    }

    const { data, errors } = await res.json()
    if (errors?.length) {
      return NextResponse.json({ error: errors[0].message }, { status: 502 })
    }

    posts = (data?.posts?.edges ?? []).map((e: { node: PHPost }) => e.node)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `PH fetch failed: ${msg}` }, { status: 502 })
  }

  // 4. Filter: AI-related, has website, not already in DB
  const candidates = posts.filter((p) => {
    if (!p.website) return false
    if (!isAIRelated(p)) return false
    try {
      const domain = new URL(p.website).hostname.replace('www.', '')
      if (existingDomains.has(domain)) return false
    } catch {
      return false
    }
    return true
  })

  if (candidates.length === 0) {
    return NextResponse.json({
      ok: true,
      inserted: 0,
      message: 'No new AI tools found on Product Hunt today',
      scanned: posts.length,
    })
  }

  // 5. Process top candidates (limited by MAX_TOOLS_PER_RUN)
  const toProcess = candidates
    .sort((a, b) => b.votesCount - a.votesCount)
    .slice(0, MAX_TOOLS_PER_RUN)

  const inserted: string[] = []
  const errors: string[] = []
  const nowIso = new Date().toISOString()

  for (const post of toProcess) {
    // Scrape website for enrichment
    const siteContent = await scrapeWebsite(post.website)

    // Enrich with Grok
    const enriched = await enrichWithGrok(post, siteContent)

    const categorySlug = inferCategory(post)
    const categoryId = categoryMap.get(categorySlug) || categoryMap.get(DEFAULT_CATEGORY_SLUG)

    if (!categoryId) {
      errors.push(`${post.name}: no category ID for "${categorySlug}"`)
      continue
    }

    let slug = slugify(post.name)
    if (existingSlugs.has(slug)) {
      slug = slugify(`${post.name}-ai`)
    }
    if (existingSlugs.has(slug)) {
      errors.push(`${post.name}: slug collision "${slug}"`)
      continue
    }

    const pricingModel = enriched?.pricing_model ?? 'freemium'
    const validPricingModels = ['free', 'freemium', 'paid', 'trial', 'contact', 'unknown'] as const
    const toolData = {
      name: post.name,
      slug,
      tagline: enriched?.tagline || post.tagline.slice(0, 150),
      description: enriched?.description || post.description.slice(0, 500),
      website_url: post.website,
      logo_url: post.thumbnail?.url ?? null,
      category_id: categoryId,
      pricing_model: (validPricingModels.includes(pricingModel as typeof validPricingModels[number])
        ? pricingModel
        : 'freemium') as typeof validPricingModels[number],
      has_api: enriched?.has_api ?? false,
      has_mobile_app: enriched?.has_mobile_app ?? false,
      is_open_source: enriched?.is_open_source ?? false,
      trains_on_data: enriched?.trains_on_data ?? false,
      has_sso: enriched?.has_sso ?? false,
      status: 'published' as const,
      published_at: nowIso,
      approved_at: nowIso,
    }

    const { error: insertError } = await admin.from('tools').insert(toolData)

    if (insertError) {
      errors.push(`${post.name}: ${insertError.message}`)
    } else {
      inserted.push(`${post.name} (${post.votesCount} votes) -> ${slug}`)
      existingSlugs.add(slug)
      try { existingDomains.add(new URL(post.website).hostname.replace('www.', '')) } catch {}
    }
  }

  return NextResponse.json({
    ok: true,
    inserted: inserted.length,
    scanned: posts.length,
    candidates: candidates.length,
    results: inserted,
    errors: errors.length > 0 ? errors : undefined,
  })
}
