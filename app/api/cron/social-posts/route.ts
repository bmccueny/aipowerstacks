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
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

/* ── Generate tweets via Grok ──────────────────────────────────────────────── */

async function generateToolHighlight(
  tool: { name: string; tagline: string; slug: string; category_name: string; pricing_model: string },
) {
  const includeLink = Math.random() < 0.4
  const linkLine = includeLink ? `\n- End with the link: ${SITE_URL}/tools/${tool.slug}` : '\n- Do NOT include any links'

  const prompt = `Write a tweet (max 260 chars) about this AI tool you genuinely find interesting:

Tool: ${tool.name}
What it does: ${tool.tagline}
Category: ${tool.category_name}
Pricing: ${tool.pricing_model}

RULES:
- Write like a real person sharing a discovery with friends, not a brand account
- Share a specific take, opinion, or use case. Why does this tool matter?
- Do NOT use em dashes, en dashes, or semicolons
- NEVER use hashtags. No # anywhere in the tweet.
- Sound like someone who builds with AI tools daily${linkLine}

Respond with ONLY the tweet text, nothing else.`

  return callGrok(prompt)
}

async function generateBlogPromo(
  post: { title: string; excerpt: string; slug: string; tags: string[] },
) {
  const includeLink = Math.random() < 0.5
  const linkLine = includeLink ? `\n- End with the link: ${SITE_URL}/blog/${post.slug}` : '\n- Do NOT include any links. Just share the insight itself.'

  const prompt = `Write a tweet (max 260 chars) sharing an insight from this article:

Title: ${post.title}
Key point: ${post.excerpt}
Topics: ${post.tags.join(', ')}

RULES:
- Lead with the most interesting or surprising takeaway, not the article title
- Write like you're sharing something you just learned, not promoting content
- Do NOT use em dashes, en dashes, or semicolons
- NEVER use hashtags. No # anywhere in the tweet.
- No "Just published", "New post", "Check out" openers
- Be opinionated. Take a stance.${linkLine}

Respond with ONLY the tweet text, nothing else.`

  return callGrok(prompt)
}

async function generateStatInsight(stats: {
  toolCount: number
  categoryCount: number
  reviewCount: number
  blogCount: number
}) {
  const prompt = `Write a tweet (max 260 chars) making an interesting observation about the AI tools landscape. You can use these data points for context:

- There are now ${stats.toolCount}+ AI tools available across ${stats.categoryCount} categories
- ${stats.reviewCount} expert reviews written
- ${stats.blogCount} articles analyzing AI trends

RULES:
- Make it a genuine observation about the AI tools market, not a brag
- Pick ONE angle and make it thought-provoking
- Do NOT use em dashes, en dashes, or semicolons
- NEVER use hashtags. No # anywhere in the tweet.
- Do NOT include any links
- End with a question or take that invites replies

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
    'the difference between AI tools that stick vs ones you drop after a week',
    'why the best AI tool is the one you actually use consistently',
  ]
  const topic = topics[Math.floor(Math.random() * topics.length)]

  const prompt = `Write a tweet (max 260 chars) sharing a real, practical take about: ${topic}

RULES:
- Give genuine advice from experience, not generic wisdom
- Sound like someone who actually builds with these tools daily
- Do NOT use em dashes, en dashes, or semicolons
- NEVER use hashtags. No # anywhere in the tweet.
- Do NOT include any links
- Make it feel like a tweet you'd actually post, not marketing copy

Respond with ONLY the tweet text, nothing else.`

  return callGrok(prompt)
}

async function generateEngagement() {
  const questions = [
    'What AI tool changed your workflow the most this year?',
    'Hot take: most AI tools are just ChatGPT wrappers. Which ones actually bring something new?',
    'If you could only keep 3 AI tools, which would you pick?',
    'What is the most underrated AI tool you use?',
    'AI tool you tried that totally surprised you (in a good way)?',
    'Biggest AI tool disappointment of 2026 so far?',
    'Solo founders: what is your must have AI tool stack?',
    'What is one AI tool you keep going back to even though alternatives exist?',
    'Unpopular opinion: what popular AI tool do you think is overrated?',
    'What is one thing you still do manually that AI probably should handle?',
    'Be honest. How many AI subscriptions are you paying for right now?',
    'What AI tool did you cancel and why?',
  ]
  const question = questions[Math.floor(Math.random() * questions.length)]

  const prompt = `Write a tweet (max 260 chars) that sparks conversation about this topic: "${question}"

RULES:
- Write like a real person on Twitter, casual and direct
- You can rephrase the question, add your own take first, or make it a hot take
- Do NOT use em dashes, en dashes, or semicolons
- NEVER use hashtags. No # anywhere in the tweet.
- Do NOT include any links
- Make people want to quote tweet or reply

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

/* ── Strip any hashtags Grok may still sneak in ──────────────────────────── */

function stripHashtags(text: string): string {
  return text.replace(/\s*#\w+/g, '').trim()
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
          const catName = (tool as { categories?: { name?: string } }).categories?.name ?? 'AI'
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
        sourceType = 'stats'
      } else if (postType === 'tip') {
        content = await generateTip()
        sourceType = 'tip'
      } else if (postType === 'engagement') {
        content = await generateEngagement()
        sourceType = 'engagement'
      }

      if (!content) {
        results.push({ type: postType, status: 'skipped', error: 'No content generated' })
        continue
      }

      content = stripHashtags(content)

      const { error: insertError } = await supabase.from('social_posts').insert({
        platform: 'twitter',
        post_type: postType,
        content,
        hashtags: [],
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({ type: postType, status: 'error', error: message.slice(0, 200) })
    }
  }

  return NextResponse.json({
    ok: true,
    generated: results.filter((r) => r.status === 'created').length,
    results,
  })
}
