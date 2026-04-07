import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateCoverImage } from '@/lib/utils/generateCoverImage'
import { addInternalLinks } from '@/lib/utils/blog-internal-links'
import { humanize } from '@/lib/utils/humanizer'
import { BLOG_CLUSTERS, type BlogCluster } from '@/lib/constants/clusters'

/* ── Editor personas (same as editor-reviews) ─────────────────────────────── */

const EDITORS: Record<string, { id: string; voice: string; beat: string; visualStyle: string }> = {
  'Rina Takahashi': {
    id: 'c131993d-8710-43f9-91ef-fb194d7113c0',
    voice:
      'Writes like Morgan Housel. Opens with a historical anecdote or story from an unexpected field. ' +
      'Each section is a self-contained mini-story that connects to the thesis. Draws parallels between ' +
      'unrelated domains. Short sentences that hit hard: "Thats the point." "Nobody saw it coming." ' +
      'References people by full name with context. Never uses bullet points. Tells stories and lets ' +
      'readers draw conclusions. Never gives direct advice. Alternates between long narrative sentences ' +
      'and short punchy ones. Uses "But" to start sentences for dramatic contrast.',
    beat: 'ML research, model architectures, training techniques, AI education',
    visualStyle: 'photorealistic',
  },
  'Tomás Herrera': {
    id: '54cd616d-c866-4f41-8ec9-f6cd57190b4a',
    voice:
      'Writes like Paul Graham. Conversational essay style. Feels like a smart friend explaining ' +
      'something over coffee. Short paragraphs, often 1-2 sentences. Uses "you" constantly. Builds ' +
      'arguments incrementally. Ends with a single punchy sentence that reframes everything. No bullet ' +
      'points, no headers, just flowing paragraphs. Asks rhetorical questions then answers them. ' +
      'Phrases like "The way to...", "What most people dont realize...", "The trick is...". ' +
      'Never uses jargon. Average sentence 12-18 words. Simple subject-verb-object.',
    beat: 'data science, AI decision-making, statistical reasoning, AI hype vs reality',
    visualStyle: 'data-viz',
  },
  'Kofi Asante': {
    id: '8d0cf351-70ee-428c-bc76-164f1ee1b929',
    voice:
      'Writes like Tim Urban (Wait But Why). Funny, self-deprecating explainer. Takes complex topics ' +
      'and makes them feel like a conversation with your most entertaining friend. Uses ALL CAPS for ' +
      'emphasis. Creates categories with funny names. Extremely long posts broken into digestible chunks. ' +
      'Uses parenthetical asides constantly (like this one). Acknowledges the reader: "Stay with me here" ' +
      'or "I know what youre thinking". Starts sentences with "And" and "But". Never writes like a textbook.',
    beat: 'AI and work, productivity experiments, human-AI collaboration, education',
    visualStyle: 'editorial-illustration',
  },
  'Mila Orozco': {
    id: '21b72dfb-882c-44ec-afc0-3a7f5391af70',
    voice:
      'Writes like Lenny Rachitsky. Data-driven but warm. Every post has frameworks, tables, and ' +
      'actionable takeaways. Opens with a specific data point. Heavy use of numbered lists. Creates ' +
      'original 2x2 matrices. "Based on my research..." Uses tables to compare approaches. Ends with ' +
      'a clear "Bottom line" section. Headers are actionable: "How to X" and "When to Y". ' +
      'Never shares an opinion without data. Always specific numbers, names, companies.',
    beat: 'AI productivity tools, automation, business use cases, workflows',
    visualStyle: 'youtube-thumbnail',
  },
  'Idris Mensah': {
    id: '4cc6e534-b024-4bf4-bd26-c382412e5802',
    voice:
      'Writes like Ben Thompson (Stratechery). Tech strategist who thinks in frameworks. Opens by ' +
      'referencing a specific news event then zooms out to the strategic implication. Connects current ' +
      'events to historical patterns in tech. "The key insight is..." Long analytical paragraphs that ' +
      'build a sustained argument. Uses blockquotes from press releases. Ends with strategic implications ' +
      'and predictions. Never writes hot takes without structural analysis. Never emotional or reactive.',
    beat: 'AI for startups, indie tools, open source, pricing, developer experience',
    visualStyle: 'retro-pixel',
  },
  'Suki Watanabe': {
    id: '6e9bf129-5598-4947-9282-c4fe5ed40ef7',
    voice:
      'Writes like Kyla Scanlon. Gen Z energy meets genuine technical literacy. Opens with a bold ' +
      'statement or "vibe check". Coins terms and phrases. Uses lowercase and informal grammar ' +
      'intentionally. Short punchy sections. Mixes serious analysis with humor and cultural references. ' +
      'References memes and internet culture naturally. Uses "like" and "literally" and "honestly" ' +
      'like spoken language. Very short sentences. Sometimes fragments. On purpose. All lowercase ' +
      'headers sometimes. Never condescending. Never boring.',
    beat: 'AI design tools, UX of AI products, creative AI, interface design',
    visualStyle: 'minimalist-3d',
  },
  'Yara Dominguez': {
    id: 'be2d6e6d-5ac7-4eed-a37e-1125dd05f964',
    voice:
      'Writes like Casey Newton (Platformer). Tech journalist who combines reporting with opinion. ' +
      'Opens with the news hook then gives context. Quotes sources directly. Balances company statements ' +
      'with user perspectives. Uses "meanwhile" to show contradictions. Numbered takeaways at the end. ' +
      'Bold claims followed by "according to [source]". Shifts to opinion with "I think..." and ' +
      '"My read is...". Never takes a press release at face value. Never ignores human impact.',
    beat: 'AI content creation, marketing AI, social media AI, growth tools',
    visualStyle: 'pop-art',
  },
  'Niko Petrov': {
    id: '1a089886-3a67-4332-8fc9-849561897b8c',
    voice:
      'Writes like Simon Willison. Developer who tests everything himself. Opens with "I built a thing" ' +
      'or "Ive been experimenting with...". Shows actual code snippets and command output. Documents ' +
      'his process step by step including dead ends. Links generously and gives credit. Uses "TIL" ' +
      'format for short discoveries. Includes specific version numbers and exact commands. "Heres the ' +
      'interesting part:" before the key insight. Ends with "You can try this yourself". ' +
      'Never hypes without testing. Never vague about configs or setup.',
    beat: 'AI coding tools, APIs, developer tools, open source AI, local models',
    visualStyle: 'cyberpunk-anime',
  },
  'Amara Chen': {
    id: '1c882cdc-fcbd-4ce1-9441-9514bfbde5c8',
    voice:
      'Writes like Anne-Laure Le Cunff (Ness Labs). Neuroscience researcher writing about productivity ' +
      'without hustle culture. Opens with a question or surprising research finding. References specific ' +
      'studies with author names. Explains the neuroscience behind why something works. Creates original ' +
      'concepts. Uses analogies from nature and biology. "Research suggests..." Ends with reflective ' +
      'questions for the reader, not commands. Inclusive "we" more than "you". Gentle imperative: ' +
      '"Consider..." rather than "Do this". Never prescriptive. Never hustle-culture.',
    beat: 'AI for teams, workflow automation, enterprise AI, adoption strategy',
    visualStyle: 'isometric',
  },
}

/* ── Constants ─────────────────────────────────────────────────────────────── */

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
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

/* ── Cluster ↔ Topic mapping ─────────────────────────────────────────────── */

const CLUSTER_TOPICS: Record<string, string[]> = {
  'llm-comparison': ['AI Tools & Product Launches', 'AI Research & Breakthroughs'],
  'ai-costs': ['AI for Business & Productivity'],
  'ai-agents': ['AI and the Future of Work'],
  'productivity': ['AI for Business & Productivity'],
  'local-ai': ['Local AI & Open Source Models'],
  'ai-creative': ['AI Creative Tools (Image, Video, Audio)'],
  'ai-coding': ['AI Coding & Developer Tools'],
  'ai-ethics': ['AI Ethics & Regulation'],
  'ai-research': ['AI Research & Breakthroughs'],
  'ai-marketing': ['AI for Business & Productivity', 'AI Tools & Product Launches'],
}

/** Pick the cluster with the fewest posts in the last 14 days (not saturated at 5+) */
async function pickThinnestCluster(supabase: ReturnType<typeof createAdminClient>): Promise<BlogCluster> {
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString()

  const { data: recentPosts } = await supabase
    .from('blog_posts')
    .select('tags')
    .eq('status', 'published')
    .gte('published_at', twoWeeksAgo)

  const clusterCounts = new Map<string, number>()
  for (const cluster of BLOG_CLUSTERS) {
    clusterCounts.set(cluster.slug, 0)
  }

  for (const post of recentPosts ?? []) {
    const tags: string[] = post.tags ?? []
    for (const cluster of BLOG_CLUSTERS) {
      if (tags.some((t) => cluster.tags.includes(t))) {
        clusterCounts.set(cluster.slug, (clusterCounts.get(cluster.slug) ?? 0) + 1)
        break
      }
    }
  }

  // Sort clusters by count ascending, skip saturated (5+)
  const eligible = BLOG_CLUSTERS
    .map((c) => ({ cluster: c, count: clusterCounts.get(c.slug) ?? 0 }))
    .filter((c) => c.count < 5)
    .sort((a, b) => a.count - b.count)

  // If all saturated, pick the one with fewest posts anyway
  if (eligible.length === 0) {
    return BLOG_CLUSTERS.reduce((min, c) =>
      (clusterCounts.get(c.slug) ?? 0) < (clusterCounts.get(min.slug) ?? 0) ? c : min
    )
  }

  // Pick randomly among the thinnest (ties)
  const minCount = eligible[0].count
  const thinnest = eligible.filter((c) => c.count === minCount)
  return thinnest[Math.floor(Math.random() * thinnest.length)].cluster
}

/* ── Title dedup helpers ───────────────────────────────────────────────────── */

/** Normalize a title into a bag of meaningful words */
function titleWords(title: string): Set<string> {
  const stopWords = new Set(['the', 'a', 'an', 'in', 'for', 'to', 'of', 'and', 'or', 'your', 'how', 'with', 'is', 'are', 'on', 'at', 'by', 'its', 'this', 'that'])
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stopWords.has(w))
  )
}

/** Jaccard similarity between two sets */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  let intersection = 0
  for (const word of a) {
    if (b.has(word)) intersection++
  }
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

/** Check if a title is too similar to any recent post titles */
async function isTitleTooSimilar(
  supabase: ReturnType<typeof createAdminClient>,
  newTitle: string,
  thresholdDays = 14,
  similarityThreshold = 0.6,
): Promise<{ similar: boolean; matchedTitle?: string; score?: number }> {
  const since = new Date(Date.now() - thresholdDays * 86400000).toISOString()
  const { data: recentPosts } = await supabase
    .from('blog_posts')
    .select('title')
    .eq('status', 'published')
    .gte('published_at', since)

  const newWords = titleWords(newTitle)

  for (const post of recentPosts ?? []) {
    const existingWords = titleWords(post.title)
    const score = jaccardSimilarity(newWords, existingWords)
    if (score >= similarityThreshold) {
      return { similar: true, matchedTitle: post.title, score }
    }
  }

  return { similar: false }
}

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

/** Fetch first-party platform data for the chosen cluster */
async function fetchPlatformData(
  supabase: ReturnType<typeof createAdminClient>,
  cluster: BlogCluster,
): Promise<string> {
  const parts: string[] = []

  // Get tools in this cluster's use cases
  const useCaseMap: Record<string, string[]> = {
    'llm-comparison': ['chatbot', 'writing', 'research', 'coding'],
    'ai-costs': ['productivity', 'writing', 'coding', 'marketing'],
    'ai-agents': ['automation', 'productivity', 'coding'],
    'productivity': ['productivity', 'writing', 'marketing', 'design'],
    'local-ai': ['coding', 'research', 'chatbot'],
  }
  const useCases = useCaseMap[cluster.slug] ?? ['productivity']

  // Tool pricing data
  const { data: pricingData } = await supabase
    .from('tool_pricing_tiers')
    .select('tool_id, tier_name, monthly_price, annual_price, tools!inner(name, slug, use_case, pricing_model)')
    .in('tools.use_case', useCases)
    .order('monthly_price', { ascending: true })
    .limit(30)

  if (pricingData && pricingData.length > 0) {
    const rows = pricingData.map((p) => {
      const tool = p.tools as unknown as { name: string; slug: string; pricing_model: string }
      return `${tool.name} | ${p.tier_name} | $${p.monthly_price}/mo | $${p.annual_price ?? 'N/A'}/yr | ${tool.pricing_model}`
    })
    parts.push(`REAL PRICING DATA FROM OUR PLATFORM (use this in comparison tables):\nTool | Tier | Monthly | Annual | Model\n${rows.join('\n')}`)
  }

  // Most tracked tools in relevant categories
  const { data: trackedData } = await supabase
    .from('user_subscriptions')
    .select('tool_id, monthly_cost, tools!inner(name, slug, use_case)')
    .in('tools.use_case', useCases)
    .limit(100)

  if (trackedData && trackedData.length > 0) {
    const toolCounts = new Map<string, { name: string; count: number; totalCost: number }>()
    for (const sub of trackedData) {
      const tool = sub.tools as unknown as { name: string }
      const existing = toolCounts.get(sub.tool_id)
      if (existing) {
        existing.count++
        existing.totalCost += Number(sub.monthly_cost)
      } else {
        toolCounts.set(sub.tool_id, { name: tool.name, count: 1, totalCost: Number(sub.monthly_cost) })
      }
    }
    const sorted = Array.from(toolCounts.values()).sort((a, b) => b.count - a.count).slice(0, 10)
    const rows = sorted.map((t) => `${t.name}: tracked by ${t.count} users, avg $${Math.round(t.totalCost / t.count)}/mo`)
    parts.push(`MOST TRACKED TOOLS IN THIS CATEGORY (from our user data):\n${rows.join('\n')}`)
  }

  // Tool overlap data
  const { data: overlapTools } = await supabase
    .from('tools')
    .select('name, slug, use_case, pricing_model')
    .eq('status', 'published')
    .in('use_case', useCases)
    .order('upvote_count', { ascending: false })
    .limit(20)

  if (overlapTools && overlapTools.length > 0) {
    const byUseCase = new Map<string, string[]>()
    for (const t of overlapTools) {
      if (!t.use_case) continue
      const list = byUseCase.get(t.use_case) ?? []
      list.push(`${t.name} (${t.pricing_model})`)
      byUseCase.set(t.use_case, list)
    }
    const rows = Array.from(byUseCase.entries()).map(([uc, tools]) => `${uc}: ${tools.join(', ')}`)
    parts.push(`TOOL OVERLAP DATA (tools competing in same categories):\n${rows.join('\n')}`)
  }

  // Site stats
  const { count: totalTools } = await supabase.from('tools').select('*', { count: 'exact', head: true }).eq('status', 'published')
  parts.push(`SITE STATS: ${totalTools ?? 400}+ tools tracked on AIPowerStacks`)

  return parts.join('\n\n')
}

/** Fetch recent posts in the same cluster for cross-linking */
async function fetchClusterSiblings(
  supabase: ReturnType<typeof createAdminClient>,
  cluster: BlogCluster,
  excludeSlug?: string,
): Promise<{ title: string; slug: string }[]> {
  const { data } = await supabase
    .from('blog_posts')
    .select('title, slug, tags')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50)

  if (!data) return []

  return data
    .filter((p) => {
      if (excludeSlug && p.slug === excludeSlug) return false
      const tags: string[] = p.tags ?? []
      return tags.some((t) => cluster.tags.includes(t))
    })
    .slice(0, 5)
    .map((p) => ({ title: p.title, slug: p.slug }))
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

/** Fisher-Yates shuffle for uniform randomness */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Pick N random editors from the pool */
function pickRandomEditors(count: number): Array<{ name: string; id: string; voice: string; beat: string; visualStyle: string }> {
  const entries = Object.entries(EDITORS).map(([name, e]) => ({ name, ...e }))
  return shuffle(entries).slice(0, count)
}

/** Pick N random topic categories */
function pickRandomTopics(count: number): string[] {
  return shuffle(TOPIC_CATEGORIES).slice(0, count)
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

/** Generate a blog post via Gemini from scraped sources */
async function generateBlogPost(
  editor: { name: string; voice: string; beat: string; visualStyle: string },
  topic: string,
  cluster: BlogCluster,
  redditItems: ScrapedItem[],
  youtubeItems: ScrapedItem[],
  twitterItems: ScrapedItem[],
  scrapedContent: string,
  platformData: string,
  siblingPosts: { title: string; slug: string }[],
  recentTitles: string[] = [],
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

  // Fetch tools and recent posts for internal linking
  const supabase = createAdminClient()
  const { data: toolRows } = await supabase.from('tools').select('name, slug').eq('status', 'published').order('upvote_count', { ascending: false }).limit(200)
  const toolList = (toolRows ?? []).map(t => `${t.name} -> /tools/${t.slug}`).join('\n')

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

== YOUR PLATFORM'S REAL DATA (MUST use in at least one comparison table) ==
${platformData || 'No platform data available.'}

== THIS POST IS PART OF THE "${cluster.label}" CONTENT CLUSTER ==
This post belongs to our ${cluster.label} series. You MUST:
- Write content that fits this cluster topic
- Include at least ONE tag from this list: ${cluster.tags.join(', ')}
- Reference and link to these related posts from our site where natural:
${siblingPosts.length > 0 ? siblingPosts.map((p) => `  - <a href="/blog/${p.slug}">${p.title}</a>`).join('\n') : '  (No sibling posts yet — this is one of the first in the cluster)'}
- Link to the cluster hub page: <a href="/blog/${cluster.slug}">${cluster.label} Guide</a>

DUPLICATE AVOIDANCE (CRITICAL — read this first):
We have recently published these articles. Your post MUST cover a DIFFERENT angle, topic, and keyword. Do NOT write about the same subject or use similar titles:
${recentTitles.length > 0 ? recentTitles.map((t) => `- "${t}"`).join('\n') : '(no recent posts)'}
If the trending sources all point to a topic we already covered, find a FRESH angle: a different tool, a contrarian take, a niche audience, a specific use case we missed, or a completely different subtopic within "${topic}".

SEO REQUIREMENTS (CRITICAL — this post must rank on Google):
1. TARGET KEYWORD: Pick ONE specific long-tail search query that people are actively Googling related to "${topic}" within the "${cluster.label}" theme. It MUST be different from any keyword implied by the recent titles above. Examples: "best AI tools for [use case] 2026", "[tool] vs [tool] comparison", "how to use AI for [task]", "free AI [category] tools". The title MUST contain this keyword naturally.
2. Title must be under 60 characters for Google SERPs. Include the year (2026) when relevant. Use power words (best, free, guide, vs, how to).
3. Write 1500 to 2500 words. This is NON-NEGOTIABLE. Short posts do not rank. Google's top results average 1,800 words. Include enough depth, examples, and analysis to fill this length naturally. Do NOT pad with filler. Add more sections, more comparisons, more practical advice.
4. Structure with clear H2 headers that include secondary keywords. Google uses H2s for featured snippets.
5. Include at least ONE comparison table using REAL DATA from the platform data above. Do NOT make up numbers. Use the actual pricing, tracking counts, and tool names from our database. This is original data no other site has.
6. The excerpt/meta description must be 150-160 characters, include the target keyword, and compel clicks.
7. Include a FAQ-style section at the end with 2-3 questions people actually search for (use "People Also Ask" style questions as H3s with direct answers).
8. Write in HTML format (use <h2>, <h3>, <p>, <ul>/<li>, <blockquote>, <strong>, <em>, <table> tags)
9. Do NOT include <h1> (the title is rendered separately)
10. Reference specific tools, projects, or discussions from the source material when relevant
11. Include 3 to 5 relevant tags. At least ONE tag MUST be from this cluster's tag list: ${cluster.tags.join(', ')}
12. Estimate reading time in minutes (typically 6 to 10 for 1500-2500 word posts)
13. INTERNAL LINKING: When you mention a tool that exists on our site, link the FIRST mention using <a href="/tools/SLUG">Tool Name</a>. Include 4-6 tool links per article. Also include 1-2 links to related blog posts listed above. Link to our compare page (/compare) or browse page (/tools) where natural. Only link tools from the list below.
14. Add a "Related in this series" section at the very end (after FAQs) with links to 2-3 sibling posts from the cluster.

== TOOLS ON OUR SITE (name -> URL path) ==
${toolList}

PERSONALITY AND EMOTIONAL TEXTURE:
- Write in first person. You have feelings, opinions, and reactions. Express them.
- Use phrases like "I was genuinely surprised by...", "This frustrated me because...", "I got excited when I saw...", "Honestly, I did not expect..."
- Take strong positions. If something impresses you, say so with conviction. If something disappoints you, say why it stings.
- Show emotional range: excitement about breakthroughs, skepticism about hype, frustration with bad practices, genuine curiosity about unknowns
- Share personal reactions to the source material as if you just read it and have thoughts
- Disagree with popular takes when you genuinely would. Not every trend deserves applause.
- Let your personality bleed through. You are not a neutral reporter, you are a columnist with taste and judgment.

ANTI-AI-DETECTION INSTRUCTIONS (CRITICAL — read every line):
- OPEN WITH THE THING, NOT WITH YOURSELF. Never start with "Hey folks", "Fellow humans", "[Name] here", "Buckle up", "Grab your coffee", "Picture this", "Let me tell you". Start with the actual news, claim, or insight. The first sentence should make someone want to read the second.
- NEVER be meta about the article. No "I know what you're thinking", "Stay with me here", "Bear with me", "But wait there's more", "(just kidding)", "(I promise this is going somewhere)". Real writers don't reassure readers that the article is worth reading.
- ONE adjective maximum before a noun. Never "the swirling, delightful, and utterly bewildering world of...". Pick one good word or use none.
- Kill formulaic transitions: "But here's the thing:", "What most people don't realize is...", "Here's where it gets interesting:" — just make the next point.
- Express excitement through SPECIFICITY, not adjectives. "The latency dropped from 2s to 40ms" is exciting. "This is genuinely mind bending!" is not.
- If you include a personal anecdote, it MUST have a specific detail: a date, a version number, a UI element, a time of day. "I tried this last week" = AI. "I tried the 0.4.2 release on my M2 Air and the VRAM usage was wild" = human.
- Use contractions naturally: "don't", "can't", "it's", "I'm", "you're"
- Vary paragraph length dramatically. Some paragraphs should be ONE sentence. Others 4-5.
- Start sentences with "And", "But", "So" for flow
- Don't stack three paragraphs with the same structure. If you wrote [topic sentence → explanation → example] twice, the third time should be different.

STRICT FORMATTING RULES:
- NEVER use hyphens, dashes, or any "-" character anywhere in your text. No em dashes (\u2014), en dashes (\u2013), hyphens (-), or double dashes (--). Write "open source" not "open-source", "real time" not "real-time", "well known" not "well-known". Use commas, periods, or colons for clause separation. This rule has ZERO exceptions.
- NEVER use semicolons. Use periods or commas instead.
- Write in a conversational but informed tone
- No fluff, no filler, no "In this article we will discuss..."
- Start with a strong hook, not a generic opener
- BANNED WORDS (these scream AI-generated): seamless, leverage, robust, nuanced, landscape, paradigm, delve, utilize, holistic, multifaceted, furthermore, tapestry. Use simple alternatives instead.
- Write like a real person who types fast. Skip an apostrophe sometimes (dont, its, youre), use lowercase, start sentences with "and" or "but", use casual phrases like "honestly" and "imo".

Respond in EXACTLY this JSON format (no extra text before or after):
{
  "title": "<SEO-optimized headline, max 60 chars, includes target keyword and year>",
  "excerpt": "<meta description, 150-160 chars, includes target keyword, compels clicks>",
  "content": "<full HTML blog post body with H2s, comparison tables, FAQ section, internal links>",
  "tags": ["tag1", "tag2", "tag3"],
  "reading_time_min": <number>,
  "topic_category": "${topic}"
}`

  const googleApiKey = process.env.GOOGLE_API_KEY
  if (!googleApiKey) throw new Error('GOOGLE_API_KEY not set')

  const res = await fetch(
    `${GEMINI_BASE_URL}/models/gemini-2.5-flash:generateContent?key=${googleApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 10000,
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(120_000),
    },
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini API error: ${res.status} ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim()

  /**
   * Sanitize control characters inside JSON string values.
   * Walks the raw JSON text and only escapes control chars found
   * between unescaped double quotes (i.e., inside string literals).
   */
  function sanitizeJsonString(raw: string): string {
    let result = ''
    let inString = false
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i]
      if (ch === '\\' && inString) {
        // Escaped char — pass through both backslash and next char
        result += ch + (raw[i + 1] ?? '')
        i++
        continue
      }
      if (ch === '"') {
        inString = !inString
        result += ch
        continue
      }
      if (inString) {
        const code = ch.charCodeAt(0)
        if (code < 0x20 || code === 0x7F) {
          // Control char inside a string value — escape it
          if (ch === '\n') result += '\\n'
          else if (ch === '\r') result += '\\r'
          else if (ch === '\t') result += '\\t'
          // else skip it
          continue
        }
      }
      result += ch
    }
    return result
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(text)
  } catch {
    // Try sanitizing control characters inside string values
    try {
      parsed = JSON.parse(sanitizeJsonString(text))
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          parsed = JSON.parse(sanitizeJsonString(match[0]))
        } catch {
          parsed = JSON.parse(match[0])
        }
      } else {
        throw new Error(`Failed to parse blog post JSON: ${text.slice(0, 300)}`)
      }
    }
  }

  const title = String(parsed.title ?? '').slice(0, 200)
  const excerpt = String(parsed.excerpt ?? '').slice(0, 500)
  const slug = slugify(title) + '-' + Date.now().toString(36)

  const cover_image_url = await generateCoverImage(title, topic, excerpt, editor.visualStyle ?? 'youtube-thumbnail')

  return {
    title,
    slug,
    excerpt,
    content: String(parsed.content ?? ''),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 5) : [],
    reading_time_min: Math.max(1, Math.min(15, Number(parsed.reading_time_min) || 4)),
    topic_category: topic,
    cover_image_url,
  }
}

/* ── Post-processing helpers ───────────────────────────────────────────────── */

/** Strip ALL dashes from display text (safety net for LLM output) */
function stripDashes(text: string): string {
  return text
    .replace(/\u2014/g, ', ')
    .replace(/\u2013/g, ', ')
    .replace(/\s*--\s*/g, ', ')
    .replace(/(\w)-(\w)/g, '$1 $2')
    .replace(/\s*-\s*/g, ' ')
}

/** Quality gate: check post meets minimum standards */
function qualityCheck(post: GeneratedPost, cluster: BlogCluster): { pass: boolean; reasons: string[] } {
  const reasons: string[] = []
  const wordCount = post.content.replace(/<[^>]+>/g, '').split(/\s+/).length

  if (wordCount < 1500) reasons.push(`Word count too low: ${wordCount}`)
  if (!post.content.includes('<h3')) reasons.push('Missing FAQ section (no H3 headers)')
  if (/[\u2014\u2013]|(\s-\s)|(--)/g.test(post.content)) reasons.push('Contains dashes after sanitization')
  if (post.tags.length < 3) reasons.push(`Fewer than 3 tags: ${post.tags.length}`)
  if (!post.content.includes('<table')) reasons.push('Missing data table with real numbers')
  if (!post.tags.some((t) => cluster.tags.includes(t))) reasons.push(`No cluster tag from: ${cluster.tags.join(', ')}`)
  if (!post.content.includes('href="/blog/')) reasons.push('No cross-links to other blog posts')

  return { pass: reasons.length === 0, reasons }
}

/* ── Route handler ─────────────────────────────────────────────────────────── */

export const maxDuration = 300

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_API_KEY not set' }, { status: 500 })
  }

  const url = new URL(request.url)
  const slot = url.searchParams.get('slot') ?? 'morning'

  const supabase = createAdminClient()

  // 1. Pick the thinnest cluster (fewest recent posts)
  const cluster = await pickThinnestCluster(supabase)

  // 2. Pick a topic within that cluster's mapped topics
  const clusterTopics = CLUSTER_TOPICS[cluster.slug] ?? TOPIC_CATEGORIES
  const topic = shuffle(clusterTopics)[0]
  const topicConfig = TOPIC_SOURCES[topic]

  // 3. Editor rotation: exclude authors of last 3 posts
  const { data: recentPosts } = await supabase
    .from('blog_posts')
    .select('author_id, title')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(15)

  const recentAuthorIds = new Set((recentPosts ?? []).slice(0, 3).map((p) => p.author_id))
  const recentTitles = (recentPosts ?? []).map((p) => p.title)
  const allEditors = Object.entries(EDITORS).map(([name, e]) => ({ name, ...e }))
  const eligibleEditors = allEditors.filter((e) => !recentAuthorIds.has(e.id))
  const editor = shuffle(eligibleEditors.length > 0 ? eligibleEditors : allEditors)[0]

  try {
    // 4. Scrape sources + fetch platform data + sibling posts in parallel
    const [postReddit, youtubeResult, postTwitter, platformData, siblingPosts] = await Promise.all([
      scrapeReddit(topicConfig.subreddits),
      scrapeYouTube(topicConfig.ytdlpQueries, topicConfig.ytSearches),
      scrapeTwitter(topicConfig.twitterQueries),
      fetchPlatformData(supabase, cluster),
      fetchClusterSiblings(supabase, cluster),
    ])
    const { items: postYoutube, transcripts: ytTranscripts } = youtubeResult

    const totalSources = postReddit.length + postYoutube.length + postTwitter.length
    if (totalSources === 0) {
      return NextResponse.json({
        ok: true,
        published: 0,
        result: { editor: editor.name, topic, cluster: cluster.slug, slot, status: 'skipped: no source material' },
      })
    }

    // 5. Scrape top URLs for deeper context
    const topUrls = [
      ...postReddit.slice(0, 1).map((r) => r.url),
      ...postYoutube.slice(0, 1).map((y) => y.url),
    ]
    const scrapedContents = await Promise.all(topUrls.map(scrapeUrl))
    const scrapedParts = scrapedContents
      .filter(Boolean)
      .map((c, idx) => `--- Web Source ${idx + 1} ---\n${c}`)

    for (const [ytUrl, transcript] of ytTranscripts) {
      const video = postYoutube.find((y) => y.url === ytUrl)
      scrapedParts.push(`--- YouTube Transcript: "${video?.title ?? 'Unknown'}" ---\n${transcript}`)
    }

    // 6. Generate with cluster context, platform data, and sibling links
    const post = await generateBlogPost(
      editor,
      topic,
      cluster,
      postReddit,
      postYoutube,
      postTwitter,
      scrapedParts.join('\n\n'),
      platformData,
      siblingPosts,
      recentTitles,
    )

    // 7. Post-process
    post.title = stripDashes(post.title)
    post.excerpt = stripDashes(post.excerpt)
    post.content = stripDashes(post.content)

    // 7b. Multi-pass humanization: deterministic fixes + metrics-driven LLM rewrite
    const humanized = await humanize(
      post.content,
      post.title,
      post.excerpt,
      process.env.GOOGLE_API_KEY!,
    )
    post.content = humanized.content
    post.title = humanized.title
    post.excerpt = humanized.excerpt

    // Ensure at least one cluster tag is present
    if (!post.tags.some((t) => cluster.tags.includes(t))) {
      post.tags.unshift(cluster.tags[0])
    }

    // Catch any tool mentions the AI prompt missed
    const linkedContent = await addInternalLinks(post.content)

    // 8. Dedup gate: reject posts too similar to recent ones
    const dupCheck = await isTitleTooSimilar(supabase, post.title)
    if (dupCheck.similar) {
      return NextResponse.json({
        ok: true,
        published: 0,
        result: {
          editor: editor.name,
          title: post.title,
          topic,
          cluster: cluster.slug,
          slot,
          status: `skipped: too similar to "${dupCheck.matchedTitle}" (score: ${dupCheck.score?.toFixed(2)})`,
        },
      })
    }

    // 9. Quality gate
    const quality = qualityCheck(post, cluster)
    const postStatus = quality.pass ? 'published' : 'draft'

    const { error } = await supabase.from('blog_posts').upsert(
      {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: linkedContent,
        cover_image_url: post.cover_image_url,
        author_id: editor.id,
        tags: post.tags,
        status: postStatus as 'draft' | 'published',
        published_at: new Date().toISOString(),
        reading_time_min: post.reading_time_min,
        topic_category: post.topic_category,
        is_featured: false,
      },
      { onConflict: 'slug' },
    )

    return NextResponse.json({
      ok: true,
      published: error ? 0 : (postStatus === 'published' ? 1 : 0),
      result: {
        editor: editor.name,
        title: post.title,
        slug: post.slug,
        topic,
        cluster: cluster.slug,
        slot,
        status: error ? `db error: ${error.message}` : postStatus,
        qualityIssues: quality.reasons.length > 0 ? quality.reasons : undefined,
        humanization: {
          scoreBefore: humanized.before.score,
          scoreAfter: humanized.after.score,
          passes: humanized.passes,
          sentenceVariance: humanized.after.sentenceLengthStdDev,
          formulaicTransitions: humanized.after.formulaicTransitions,
        },
        sources: { reddit: postReddit.length, youtube: postYoutube.length, twitter: postTwitter.length, transcripts: ytTranscripts.size },
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({
      ok: false,
      published: 0,
      result: { editor: editor.name, topic, cluster: cluster.slug, slot, status: `error: ${msg.slice(0, 200)}` },
    }, { status: 500 })
  }
}
