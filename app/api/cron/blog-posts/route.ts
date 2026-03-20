import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateCoverImage } from '@/lib/utils/generateCoverImage'
import { injectVisualizers } from '@/lib/utils/injectVisualizers'

/* ── Editor personas (same as editor-reviews) ─────────────────────────────── */

const EDITORS: Record<string, { id: string; voice: string; beat: string }> = {
  'Andrew Ng': {
    id: 'c131993d-8710-43f9-91ef-fb194d7113c0',
    voice:
      'Measured, technically precise, educational lens. References ML concepts. ' +
      'Values openness, reproducibility, and practical impact on learners and teams.',
    beat: 'ML research, model architectures, training techniques, AI education',
  },
  'Cassie Kozyrkov': {
    id: '54cd616d-c866-4f41-8ec9-f6cd57190b4a',
    voice:
      'Decision-science framing. Analytically skeptical, calls out false confidence. ' +
      'Cares about data quality and calibration. Occasionally blunt.',
    beat: 'data science, AI decision-making, statistical reasoning, AI hype vs reality',
  },
  'Ethan Mollick': {
    id: '8d0cf351-70ee-428c-bc76-164f1ee1b929',
    voice:
      'Optimistic about AI-human collaboration. References research and workplace trends. ' +
      'Accessible academic tone. Experimental, hands-on.',
    beat: 'AI and work, productivity experiments, human-AI collaboration, education',
  },
  'Zain Kahn': {
    id: '21b72dfb-882c-44ec-afc0-3a7f5391af70',
    voice:
      'Practical, educational, productivity-focused. Direct and enthusiastic when impressed. ' +
      '"How to use this to save 10 hours." Speaks to professionals and founders.',
    beat: 'AI productivity tools, automation, business use cases, workflows',
  },
  'Marcus Thompson': {
    id: '4cc6e534-b024-4bf4-bd26-c382412e5802',
    voice:
      'Bootstrapped SaaS founder. Direct, pricing-aware, respects simplicity. ' +
      'Hard to impress. Calls out bloat. Praises tools that just work.',
    beat: 'AI for startups, indie tools, open source, pricing, developer experience',
  },
  'Lena Fischer': {
    id: '6e9bf129-5598-4947-9282-c4fe5ed40ef7',
    voice:
      'Berlin UX designer. Evaluates interface quality as much as output quality. ' +
      'Calls out dark patterns, opaque AI, and design that serves the demo not the user.',
    beat: 'AI design tools, UX of AI products, creative AI, interface design',
  },
  'Aisha Okonkwo': {
    id: 'be2d6e6d-5ac7-4eed-a37e-1125dd05f964',
    voice:
      'Content strategist and growth marketer. Real workflow perspective. ' +
      'Warm but results-focused. Honest about AI content quality.',
    beat: 'AI content creation, marketing AI, social media AI, growth tools',
  },
  'Dev Patel': {
    id: '1a089886-3a67-4332-8fc9-849561897b8c',
    voice:
      'Full-stack developer. Tests the API, reads the docs, checks GitHub issues. ' +
      'Values open source, documentation quality, and honest error messages.',
    beat: 'AI coding tools, APIs, developer tools, open source AI, local models',
  },
  'Sofia Reyes': {
    id: '1c882cdc-fcbd-4ce1-9441-9514bfbde5c8',
    voice:
      'Startup operator / COO. Systems lens. Cares about team adoption and async workflows. ' +
      'Practical, people-oriented, thinks about onboarding and org-wide rollout.',
    beat: 'AI for teams, workflow automation, enterprise AI, adoption strategy',
  },
}

/* ── Constants ─────────────────────────────────────────────────────────────── */

const XAI_BASE_URL = 'https://api.x.ai/v1'
const JINA_BASE = 'https://r.jina.ai'

const AI_KEYWORDS = ['ai', 'llm', 'gpt', 'model', 'machine learning', 'neural', 'transformer', 'openai', 'anthropic', 'claude', 'gemini', 'copilot', 'agent', 'chatbot', 'diffusion', 'fine-tun', 'rag', 'embedding', 'inference', 'deep learning', 'artificial intelligence']

const TOPIC_SOURCES: Record<string, {
  subreddits: string[]
  ytSearches: string[]
  ytdlpQueries: string[]
  twitterQueries: string[]
}> = {
  'AI Tools & Product Launches': {
    subreddits: ['artificial', 'ChatGPT', 'singularity'],
    ytSearches: ['https://www.youtube.com/results?search_query=new+AI+tools+launch+2026&sp=CAISBAgCEAE'],
    ytdlpQueries: ['ytsearch5:new AI tools product launch 2026'],
    twitterQueries: ['AI tool launch new', 'AI product release 2026'],
  },
  'AI Research & Breakthroughs': {
    subreddits: ['MachineLearning', 'artificial', 'deeplearning'],
    ytSearches: ['https://www.youtube.com/results?search_query=AI+research+breakthrough+paper+2026&sp=CAISBAgCEAE'],
    ytdlpQueries: ['ytsearch5:AI research paper breakthrough 2026'],
    twitterQueries: ['AI research breakthrough paper', 'new AI model benchmark SOTA'],
  },
  'AI for Business & Productivity': {
    subreddits: ['ChatGPT', 'artificial', 'Automate'],
    ytSearches: ['https://www.youtube.com/results?search_query=AI+business+productivity+workflow+2026&sp=CAISBAgCEAE'],
    ytdlpQueries: ['ytsearch5:AI productivity business automation workflow'],
    twitterQueries: ['AI productivity business automation', 'AI save time workflow'],
  },
  'AI Ethics & Regulation': {
    subreddits: ['artificial', 'singularity', 'MachineLearning'],
    ytSearches: ['https://www.youtube.com/results?search_query=AI+ethics+regulation+policy+2026&sp=CAISBAgCEAE'],
    ytdlpQueries: ['ytsearch5:AI ethics regulation safety alignment'],
    twitterQueries: ['AI ethics regulation policy', 'AI safety alignment concern'],
  },
  'AI Coding & Developer Tools': {
    subreddits: ['LocalLLaMA', 'MachineLearning', 'ChatGPTCoding'],
    ytSearches: ['https://www.youtube.com/results?search_query=AI+coding+tools+developer+copilot+2026&sp=CAISBAgCEAE'],
    ytdlpQueries: ['ytsearch5:AI coding assistant developer tools 2026'],
    twitterQueries: ['AI coding tool copilot cursor', 'AI developer experience code generation'],
  },
  'AI Creative Tools (Image, Video, Audio)': {
    subreddits: ['StableDiffusion', 'midjourney', 'artificial'],
    ytSearches: ['https://www.youtube.com/results?search_query=AI+image+video+generation+creative+2026&sp=CAISBAgCEAE'],
    ytdlpQueries: ['ytsearch5:AI image video generation creative tools'],
    twitterQueries: ['AI image generation art creative', 'AI video generation sora runway'],
  },
  'Local AI & Open Source Models': {
    subreddits: ['LocalLLaMA', 'ollama', 'MachineLearning'],
    ytSearches: ['https://www.youtube.com/results?search_query=local+AI+open+source+LLM+run+locally+2026&sp=CAISBAgCEAE'],
    ytdlpQueries: ['ytsearch5:run AI locally open source LLM ollama'],
    twitterQueries: ['local LLM open source model', 'run AI locally ollama llama'],
  },
  'AI and the Future of Work': {
    subreddits: ['singularity', 'artificial', 'ChatGPT'],
    ytSearches: ['https://www.youtube.com/results?search_query=AI+future+of+work+jobs+automation+2026&sp=CAISBAgCEAE'],
    ytdlpQueries: ['ytsearch5:AI future of work jobs automation replacement'],
    twitterQueries: ['AI future of work jobs replaced', 'AI automation workforce impact'],
  },
}

const TOPIC_CATEGORIES = Object.keys(TOPIC_SOURCES)

/* ── Scraping helpers ──────────────────────────────────────────────────────── */

interface ScrapedItem {
  title: string
  url: string
  source: 'reddit' | 'youtube' | 'twitter'
  subreddit?: string
  score?: number
  snippet?: string
}

/** Check if a CLI tool is available */
function hasCommand(cmd: string): boolean {
  try {
    const { execFileSync } = require('child_process')
    execFileSync('which', [cmd], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/** Run a CLI command and return stdout, or null on failure */
function runCommand(cmd: string, args: string[], timeoutMs = 15_000): string | null {
  try {
    const { execFileSync } = require('child_process')
    const result = execFileSync(cmd, args, {
      timeout: timeoutMs,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 1024 * 1024,
    })
    return result
  } catch {
    return null
  }
}

const HAS_YTDLP = hasCommand('yt-dlp')
const HAS_XREACH = hasCommand('xreach')

/** Scrape Reddit JSON API for hot posts from topic-specific subreddits */
async function scrapeReddit(subreddits: string[]): Promise<ScrapedItem[]> {
  const items: ScrapedItem[] = []

  for (const sub of subreddits) {
    const url = `https://www.reddit.com/r/${sub}/hot/.json?limit=10`
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'AIPowerStacks/1.0 (blog cron)',
        },
        signal: AbortSignal.timeout(8_000),
      })
      if (!res.ok) continue

      const json = await res.json()
      const posts = json?.data?.children ?? []

      for (const post of posts) {
        const d = post?.data
        if (!d || d.stickied || d.over_18) continue

        const text = `${d.title} ${d.selftext ?? ''}`.toLowerCase()
        const isRelevant = AI_KEYWORDS.some((kw) => text.includes(kw))
        if (!isRelevant && sub !== 'artificial' && sub !== 'MachineLearning') continue

        items.push({
          title: d.title,
          url: d.url?.startsWith('http') ? d.url : `https://www.reddit.com${d.permalink}`,
          source: 'reddit',
          subreddit: d.subreddit,
          score: d.score,
          snippet: (d.selftext ?? '').slice(0, 500) || undefined,
        })
      }
    } catch {
      // Skip failed subreddit
    }
  }

  return items
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 8)
}

/** Scrape YouTube via yt-dlp or Jina Reader fallback */
async function scrapeYouTube(
  ytdlpQueries: string[],
  jinaSearchUrls: string[],
): Promise<{ items: ScrapedItem[]; transcripts: Map<string, string> }> {
  const items: ScrapedItem[] = []
  const transcripts = new Map<string, string>()

  if (HAS_YTDLP) {
    for (const query of ytdlpQueries) {
      const raw = runCommand('yt-dlp', [
        '--dump-json',
        '--flat-playlist',
        '--no-warnings',
        query,
      ], 20_000)
      if (!raw) continue

      for (const line of raw.trim().split('\n')) {
        try {
          const d = JSON.parse(line)
          const title = d.title ?? ''
          const url = d.url ?? d.webpage_url ?? (d.id ? `https://www.youtube.com/watch?v=${d.id}` : '')
          if (!title || !url) continue

          const lower = title.toLowerCase()
          if (!AI_KEYWORDS.some((kw) => lower.includes(kw))) continue

          items.push({ title, url, source: 'youtube', snippet: d.description?.slice(0, 300) })
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    const seen = new Set<string>()
    const uniqueItems = items.filter((i) => {
      if (seen.has(i.url)) return false
      seen.add(i.url)
      return true
    })

    for (const item of uniqueItems.slice(0, 3)) {
      const raw = runCommand('yt-dlp', [
        '--dump-json',
        '--no-download',
        '--no-warnings',
        item.url,
      ], 15_000)
      if (!raw) continue

      try {
        const meta = JSON.parse(raw)
        const subs = meta.subtitles?.en ?? meta.automatic_captions?.en ?? []
        if (subs.length > 0) {
          const subEntry = subs.find((s: { ext?: string; url?: string }) => s.ext === 'json3') ?? subs.find((s: { ext?: string; url?: string }) => s.ext === 'srv1') ?? subs[0]
          if (subEntry?.url) {
            try {
              const subRes = await fetch(subEntry.url, { signal: AbortSignal.timeout(8_000) })
              if (subRes.ok) {
                const subData = await subRes.text()
                // For json3 format, extract text from events
                let transcript = ''
                if (subEntry.ext === 'json3') {
                  try {
                    const parsed = JSON.parse(subData)
                    transcript = (parsed.events ?? [])
                      .flatMap((e: { segs?: { utf8?: string }[] }) => (e.segs ?? []).map((s: { utf8?: string }) => s.utf8 ?? ''))
                      .join('')
                      .replace(/\n+/g, ' ')
                      .trim()
                  } catch {
                    transcript = subData.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
                  }
                } else {
                  // For srv1/vtt, strip tags
                  transcript = subData.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
                }
                if (transcript.length > 100) {
                  transcripts.set(item.url, transcript.slice(0, 5000))
                }
              }
            } catch {
              // Subtitle download failed, continue
            }
          }
        }
      } catch {
        // Metadata parse failed
      }
    }

    if (items.length > 0) {
      const deduped = new Set<string>()
      return {
        items: items.filter((i) => { if (deduped.has(i.url)) return false; deduped.add(i.url); return true }).slice(0, 10),
        transcripts,
      }
    }
  }

  // Fallback: Jina Reader scraping (works on Vercel)
  for (const searchUrl of jinaSearchUrls) {
    try {
      const jinaUrl = `${JINA_BASE}/${searchUrl}`
      const res = await fetch(jinaUrl, {
        headers: { Accept: 'text/plain' },
        signal: AbortSignal.timeout(12_000),
      })
      if (!res.ok) continue

      const text = await res.text()
      const linkRegex = /\[([^\]]{10,})\]\((https:\/\/www\.youtube\.com\/watch\?v=[^\)]+)\)/g
      let match
      while ((match = linkRegex.exec(text)) !== null) {
        const title = match[1].trim()
        const url = match[2]
        const lower = title.toLowerCase()
        if (!AI_KEYWORDS.some((kw) => lower.includes(kw))) continue
        items.push({ title, url, source: 'youtube' })
      }
    } catch {
      // Skip failed search
    }
  }

  const seen = new Set<string>()
  return {
    items: items.filter((item) => { if (seen.has(item.url)) return false; seen.add(item.url); return true }).slice(0, 10),
    transcripts,
  }
}

/** Scrape Twitter/X via xreach CLI */
async function scrapeTwitter(queries: string[]): Promise<ScrapedItem[]> {
  if (!HAS_XREACH || queries.length === 0) return []

  const items: ScrapedItem[] = []

  for (const query of queries) {
    const raw = runCommand('xreach', ['search', query, '--json', '-n', '5'], 12_000)
    if (!raw) continue

    try {
      const parsed = JSON.parse(raw)
      const list = parsed?.items ?? (Array.isArray(parsed) ? parsed : parsed?.data ?? [])

      for (const tweet of list) {
        const text = tweet.text ?? tweet.full_text ?? ''
        const tweetId = tweet.id_str ?? tweet.id ?? ''
        // xreach uses user.restId, not screenName
        const userId = tweet.user?.restId ?? tweet.user?.id ?? ''
        const url = tweetId ? `https://x.com/i/status/${tweetId}` : ''

        if (!text || !url) continue

        items.push({
          title: text.slice(0, 140),
          url,
          source: 'twitter',
          snippet: text.slice(0, 500),
          score: tweet.likeCount ?? tweet.favorite_count ?? tweet.public_metrics?.like_count ?? 0,
        })
      }
    } catch {
      // Parse failure, skip this search
    }
  }

  return items
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 10)
}

/** Scrape a URL via Jina Reader */
async function scrapeUrl(url: string): Promise<string | null> {
  try {
    const jinaUrl = `${JINA_BASE}/${url}`
    const res = await fetch(jinaUrl, {
      headers: { Accept: 'text/plain' },
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) return null
    const text = await res.text()
    return text.slice(0, 6000)
  } catch {
    return null
  }
}

/* ── Blog post generation ──────────────────────────────────────────────────── */

interface GeneratedPost {
  title: string
  slug: string
  excerpt: string
  content: string
  tags: string[]
  reading_time_min: number
  topic_category: string
  cover_image_url: string | null
}

/** Pick N random editors from the pool */
function pickRandomEditors(count: number): Array<{ name: string; id: string; voice: string; beat: string }> {
  const entries = Object.entries(EDITORS).map(([name, e]) => ({ name, ...e }))
  const shuffled = entries.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/** Pick N random topic categories */
function pickRandomTopics(count: number): string[] {
  const shuffled = [...TOPIC_CATEGORIES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/** Generate a slug from a title */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/-$/, '')
}

/** Generate a blog post via Grok from scraped sources */
async function generateBlogPost(
  editor: { name: string; voice: string; beat: string },
  topic: string,
  redditItems: ScrapedItem[],
  youtubeItems: ScrapedItem[],
  twitterItems: ScrapedItem[],
  scrapedContent: string,
): Promise<GeneratedPost> {
  const redditContext = redditItems
    .map((r) => `- [r/${r.subreddit}] "${r.title}" (score: ${r.score})${r.snippet ? `\n  ${r.snippet.slice(0, 200)}` : ''}`)
    .join('\n')

  const youtubeContext = youtubeItems
    .map((y) => `- "${y.title}" (${y.url})${y.snippet ? `\n  ${y.snippet.slice(0, 200)}` : ''}`)
    .join('\n')

  const twitterContext = twitterItems
    .map((t) => `- ${t.title}${t.snippet ? `\n  ${t.snippet.slice(0, 300)}` : ''}`)
    .join('\n')

  const prompt = `You are ${editor.name}, a respected voice in AI, writing a blog post for AIPowerStacks (an AI tools directory).

YOUR VOICE: ${editor.voice}
YOUR BEAT: ${editor.beat}

TODAY'S TOPIC CATEGORY: ${topic}

Write a blog post based on today's trending AI discussions and content. Use the source material below as inspiration and reference points, but write original analysis and commentary in your unique voice.

== TRENDING REDDIT DISCUSSIONS ==
${redditContext || 'No Reddit data available today.'}

== TRENDING YOUTUBE AI CONTENT ==
${youtubeContext || 'No YouTube data available today.'}

== TRENDING TWITTER/X DISCUSSIONS ==
${twitterContext || 'No Twitter data available today.'}

== SCRAPED SOURCE CONTENT (for deeper context) ==
${scrapedContent || 'No additional scraped content available.'}

REQUIREMENTS:
1. Write a compelling, opinionated blog post (600 to 1000 words) about a specific angle within "${topic}"
2. The post should feel timely, referencing current discussions and trends
3. Include practical takeaways for builders, founders, or professionals
4. Write in HTML format (use <h2>, <h3>, <p>, <ul>/<li>, <blockquote>, <strong>, <em> tags)
5. Do NOT include <h1> (the title is rendered separately)
6. Reference specific tools, projects, or discussions from the source material when relevant
7. Include 3 to 5 relevant tags (lowercase, single words or hyphenated compounds)
8. Estimate reading time in minutes (typically 3 to 5)

PERSONALITY AND EMOTIONAL TEXTURE:
- Write in first person. You have feelings, opinions, and reactions. Express them.
- Use phrases like "I was genuinely surprised by...", "This frustrated me because...", "I got excited when I saw...", "Honestly, I did not expect..."
- Take strong positions. If something impresses you, say so with conviction. If something disappoints you, say why it stings.
- Show emotional range: excitement about breakthroughs, skepticism about hype, frustration with bad practices, genuine curiosity about unknowns
- Share personal reactions to the source material as if you just read it and have thoughts
- Disagree with popular takes when you genuinely would. Not every trend deserves applause.
- Let your personality bleed through. You are not a neutral reporter, you are a columnist with taste and judgment.

STRICT FORMATTING RULES:
- NEVER use em dashes, en dashes, or spaced hyphens. No \u2014 \u2013 or " - " anywhere. Use commas, periods, or colons instead.
- Hyphens ONLY allowed inside compound words (e.g. "open-source", "real-time"). Never as punctuation between clauses.
- NEVER use semicolons. Use periods or commas instead.
- Write in a conversational but informed tone
- No fluff, no filler, no "In this article we will discuss..."
- Start with a strong hook, not a generic opener

Respond in EXACTLY this JSON format (no extra text before or after):
{
  "title": "<compelling headline, max 80 chars>",
  "excerpt": "<1-2 sentence summary, max 200 chars>",
  "content": "<full HTML blog post body>",
  "tags": ["tag1", "tag2", "tag3"],
  "reading_time_min": <number>,
  "topic_category": "${topic}"
}`

  const res = await fetch(`${XAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-3-mini-fast',
      max_tokens: 4000,
      temperature: 0.85,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Grok API error: ${res.status} ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = (data.choices?.[0]?.message?.content ?? '').trim()

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      parsed = JSON.parse(match[0])
    } else {
      throw new Error(`Failed to parse blog post JSON: ${text.slice(0, 300)}`)
    }
  }

  const title = String(parsed.title ?? '').slice(0, 200)
  const excerpt = String(parsed.excerpt ?? '').slice(0, 500)
  const slug = slugify(title) + '-' + Date.now().toString(36)

  const cover_image_url = await generateCoverImage(title, topic, excerpt, true)

  return {
    title,
    slug,
    excerpt,
    content: await injectVisualizers(String(parsed.content ?? '')),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 5) : [],
    reading_time_min: Math.max(1, Math.min(15, Number(parsed.reading_time_min) || 4)),
    topic_category: topic,
    cover_image_url,
  }
}

/* ── Route handler ─────────────────────────────────────────────────────────── */

export const maxDuration = 60 // Vercel Hobby plan limit

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

  // Single post per invocation to stay within Vercel timeout
  const editor = pickRandomEditors(1)[0]
  const topic = pickRandomTopics(1)[0]
  const topicConfig = TOPIC_SOURCES[topic]

  try {
    const [postReddit, youtubeResult, postTwitter] = await Promise.all([
      scrapeReddit(topicConfig.subreddits),
      scrapeYouTube(topicConfig.ytdlpQueries, topicConfig.ytSearches),
      scrapeTwitter(topicConfig.twitterQueries),
    ])
    const { items: postYoutube, transcripts: ytTranscripts } = youtubeResult

    const totalSources = postReddit.length + postYoutube.length + postTwitter.length
    if (totalSources === 0) {
      return NextResponse.json({
        ok: true,
        published: 0,
        result: { editor: editor.name, topic, status: 'skipped: no source material' },
      })
    }

    const topUrls = [
      ...postReddit.slice(0, 1).map((r) => r.url),
      ...postYoutube.slice(0, 1).map((y) => y.url),
    ]
    const scrapedContents = await Promise.all(topUrls.map(scrapeUrl))
    const scrapedParts = scrapedContents
      .filter(Boolean)
      .map((c, idx) => `--- Web Source ${idx + 1} ---\n${c}`)

    for (const [url, transcript] of ytTranscripts) {
      const video = postYoutube.find((y) => y.url === url)
      scrapedParts.push(`--- YouTube Transcript: "${video?.title ?? 'Unknown'}" ---\n${transcript}`)
    }

    const post = await generateBlogPost(
      editor,
      topic,
      postReddit,
      postYoutube,
      postTwitter,
      scrapedParts.join('\n\n'),
    )

    const { error } = await supabase.from('blog_posts').upsert(
      {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        cover_image_url: post.cover_image_url,
        author_id: editor.id,
        tags: post.tags,
        status: 'published' as const,
        published_at: new Date().toISOString(),
        reading_time_min: post.reading_time_min,
        is_featured: false,
      },
      { onConflict: 'slug' },
    )

    return NextResponse.json({
      ok: true,
      published: error ? 0 : 1,
      result: {
        editor: editor.name,
        title: post.title,
        slug: post.slug,
        topic,
        status: error ? `db error: ${error.message}` : 'published',
        sources: { reddit: postReddit.length, youtube: postYoutube.length, twitter: postTwitter.length, transcripts: ytTranscripts.size },
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({
      ok: false,
      published: 0,
      result: { editor: editor.name, topic, status: `error: ${msg.slice(0, 200)}` },
    }, { status: 500 })
  }
}
