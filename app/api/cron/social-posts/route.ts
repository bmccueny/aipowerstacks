import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SITE_URL } from '@/lib/constants/site'

const XAI_BASE_URL = 'https://api.x.ai/v1'

/* ── Post type templates ───────────────────────────────────────────────────── */

type PostType = 'tool_highlight' | 'blog_promo' | 'stat_insight' | 'tip' | 'engagement'

const POST_TYPES: PostType[] = [
  'tool_highlight',
  'blog_promo',
  'stat_insight',
  'tip',
  'engagement',
]

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

/* ── Generate tweets via Grok ──────────────────────────────────────────────── */

async function generateToolHighlight(
  tool: { name: string; tagline: string; slug: string; category_name: string; pricing_model: string },
) {
  const prompt = `Write a tweet (max 260 chars) promoting this AI tool from AIPowerStacks.com:

Tool: ${tool.name}
Tagline: ${tool.tagline}
Category: ${tool.category_name}
Pricing: ${tool.pricing_model}
Link: ${SITE_URL}/tools/${tool.slug}

RULES:
- Be genuinely enthusiastic but not spammy
- Include the link at the end
- Do NOT use em dashes, en dashes, or semicolons
- Include 2 to 3 relevant hashtags inline or at the end
- Sound like a knowledgeable tech curator, not a bot
- Share what makes this tool worth checking out

Respond with ONLY the tweet text, nothing else.`

  return callGrok(prompt)
}

async function generateBlogPromo(
  post: { title: string; excerpt: string; slug: string; tags: string[] },
) {
  const prompt = `Write a tweet (max 260 chars) promoting this blog post from AIPowerStacks.com:

Title: ${post.title}
Excerpt: ${post.excerpt}
Tags: ${post.tags.join(', ')}
Link: ${SITE_URL}/blog/${post.slug}

RULES:
- Hook the reader with the most interesting takeaway
- Include the link at the end
- Do NOT use em dashes, en dashes, or semicolons
- Include 2 to 3 relevant hashtags
- Sound like a tech content curator sharing something genuinely interesting
- No "Check out our latest post" generic openers

Respond with ONLY the tweet text, nothing else.`

  return callGrok(prompt)
}

async function generateStatInsight(stats: {
  toolCount: number
  categoryCount: number
  reviewCount: number
  blogCount: number
}) {
  const prompt = `Write a tweet (max 260 chars) sharing an interesting stat or milestone about AIPowerStacks.com, an AI tools directory.

Current stats:
- ${stats.toolCount} AI tools listed
- ${stats.categoryCount} categories
- ${stats.reviewCount} expert reviews
- ${stats.blogCount} blog posts

RULES:
- Pick ONE compelling angle (don't list all stats)
- Sound proud but not braggy
- Include a call to action like "Explore the full directory" with link: ${SITE_URL}
- Do NOT use em dashes, en dashes, or semicolons
- Include 1 to 2 hashtags
- Be conversational, not corporate

Respond with ONLY the tweet text, nothing else.`

  return callGrok(prompt)
}

async function generateTip() {
  const topics = [
    'choosing the right AI tool for your workflow',
    'evaluating AI tool pricing and value',
    'combining multiple AI tools into a stack',
    'avoiding AI tool overload',
    'getting the most out of free AI tools',
    'when to switch from one AI tool to another',
    'building an AI workflow as a solo founder',
    'AI tools for content creators on a budget',
  ]
  const topic = topics[Math.floor(Math.random() * topics.length)]

  const prompt = `Write a tweet (max 260 chars) sharing a practical tip about: ${topic}

RULES:
- Give genuine, actionable advice
- Sound like someone who actually uses these tools daily
- End with something like "More AI tool insights at ${SITE_URL}" or similar
- Do NOT use em dashes, en dashes, or semicolons
- Include 1 to 2 hashtags
- No filler, every word should earn its place

Respond with ONLY the tweet text, nothing else.`

  return callGrok(prompt)
}

async function generateEngagement() {
  const prompts = [
    'What AI tool changed your workflow the most this year?',
    'Hot take: most AI tools are just ChatGPT wrappers. Which ones actually bring something new?',
    'If you could only keep 3 AI tools, which would you pick?',
    'What is the most underrated AI tool you use?',
    'AI tool you tried that totally surprised you (in a good way)?',
    'Biggest AI tool disappointment of 2026 so far?',
    'Solo founders: what is your must have AI tool stack?',
    'What is one AI tool you keep going back to even though alternatives exist?',
  ]
  const question = prompts[Math.floor(Math.random() * prompts.length)]

  const prompt = `Write a tweet (max 260 chars) asking this engaging question to the AI community: "${question}"

RULES:
- Make it feel casual and genuine, like a real person asking
- You can rephrase the question to be more engaging
- Include 1 to 2 relevant hashtags
- Do NOT use em dashes, en dashes, or semicolons
- Do NOT include any links
- Encourage replies

Respond with ONLY the tweet text, nothing else.`

  return callGrok(prompt)
}

async function callGrok(prompt: string): Promise<string> {
  const res = await fetch(`${XAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-3-mini-fast',
      max_tokens: 500,
      temperature: 0.9,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Grok API error: ${res.status} ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = (data.choices?.[0]?.message?.content ?? '').trim()

  // Strip surrounding quotes if present
  return text.replace(/^["']|["']$/g, '')
}

/* ── Extract hashtags from tweet text ──────────────────────────────────────── */

function extractHashtags(text: string): string[] {
  const matches = text.match(/#\w+/g)
  return matches ? matches.map((h) => h.toLowerCase()) : []
}

/* ── Route handler ─────────────────────────────────────────────────────────── */

export const maxDuration = 60

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.XAI_API_KEY) {
    return NextResponse.json({ error: 'XAI_API_KEY not set' }, { status: 500 })
  }

  const supabase = createAdminClient()

  // Pick 2 random post types for today
  const todayTypes = pickRandom(POST_TYPES, 2)

  const results: Array<{ type: string; status: string; content?: string; error?: string }> = []

  for (const postType of todayTypes) {
    try {
      let content = ''
      let linkUrl: string | null = null
      let linkTitle: string | null = null
      let sourceType: string | null = null
      let sourceId: string | null = null

      if (postType === 'tool_highlight') {
        // Get a random published tool that hasn't been tweeted about recently
        const { data: recentToolIds } = await supabase
          .from('social_posts')
          .select('source_id')
          .eq('source_type', 'tool')
          .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString())

        const excludeIds = (recentToolIds ?? []).map((r) => r.source_id).filter(Boolean)

        let query = supabase
          .from('tools')
          .select('id, name, tagline, slug, pricing_model, categories!inner(name)')
          .eq('status', 'published')
          .limit(50)

        if (excludeIds.length > 0) {
          query = query.not('id', 'in', `(${excludeIds.join(',')})`)
        }

        const { data: tools } = await query

        if (tools && tools.length > 0) {
          const tool = tools[Math.floor(Math.random() * tools.length)]
          const catName = (tool as any).categories?.name ?? 'AI'
          content = await generateToolHighlight({
            name: tool.name,
            tagline: tool.tagline,
            slug: tool.slug,
            category_name: catName,
            pricing_model: tool.pricing_model,
          })
          linkUrl = `${SITE_URL}/tools/${tool.slug}`
          linkTitle = tool.name
          sourceType = 'tool'
          sourceId = tool.id
        } else {
          content = await generateTip()
        }
      } else if (postType === 'blog_promo') {
        // Get a recent blog post not yet promoted
        const { data: recentPostIds } = await supabase
          .from('social_posts')
          .select('source_id')
          .eq('source_type', 'blog_post')
          .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString())

        const excludeIds = (recentPostIds ?? []).map((r) => r.source_id).filter(Boolean)

        let query = supabase
          .from('blog_posts')
          .select('id, title, excerpt, slug, tags')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(20)

        if (excludeIds.length > 0) {
          query = query.not('id', 'in', `(${excludeIds.join(',')})`)
        }

        const { data: posts } = await query

        if (posts && posts.length > 0) {
          const post = posts[Math.floor(Math.random() * posts.length)]
          content = await generateBlogPromo({
            title: post.title,
            excerpt: post.excerpt ?? '',
            slug: post.slug,
            tags: post.tags ?? [],
          })
          linkUrl = `${SITE_URL}/blog/${post.slug}`
          linkTitle = post.title
          sourceType = 'blog_post'
          sourceId = post.id
        } else {
          content = await generateTip()
        }
      } else if (postType === 'stat_insight') {
        const [toolsRes, catsRes, reviewsRes, blogRes] = await Promise.all([
          supabase.from('tools').select('id', { count: 'exact', head: true }).eq('status', 'published'),
          supabase.from('categories').select('id', { count: 'exact', head: true }),
          supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'published'),
          supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        ])
        content = await generateStatInsight({
          toolCount: toolsRes.count ?? 0,
          categoryCount: catsRes.count ?? 0,
          reviewCount: reviewsRes.count ?? 0,
          blogCount: blogRes.count ?? 0,
        })
        linkUrl = SITE_URL
        linkTitle = 'AIPowerStacks'
        sourceType = 'stats'
      } else if (postType === 'tip') {
        content = await generateTip()
        linkUrl = SITE_URL
        linkTitle = 'AIPowerStacks'
        sourceType = 'tip'
      } else if (postType === 'engagement') {
        content = await generateEngagement()
        sourceType = 'engagement'
      }

      if (!content) {
        results.push({ type: postType, status: 'skipped', error: 'No content generated' })
        continue
      }

      const hashtags = extractHashtags(content)

      const { error: insertError } = await supabase.from('social_posts').insert({
        platform: 'twitter',
        post_type: postType,
        content,
        hashtags,
        link_url: linkUrl,
        link_title: linkTitle,
        source_type: sourceType,
        source_id: sourceId,
        status: 'draft',
      })

      if (insertError) {
        results.push({ type: postType, status: 'error', error: insertError.message })
      } else {
        results.push({ type: postType, status: 'created', content: content.slice(0, 100) })
      }
    } catch (err: any) {
      results.push({ type: postType, status: 'error', error: err.message?.slice(0, 200) })
    }
  }

  return NextResponse.json({
    ok: true,
    generated: results.filter((r) => r.status === 'created').length,
    results,
  })
}
