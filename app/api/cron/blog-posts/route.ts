import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateCoverImage } from '@/lib/utils/generateCoverImage'
import { addInternalLinks } from '@/lib/utils/blog-internal-links'

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

SEO REQUIREMENTS (CRITICAL — this post must rank on Google):
1. TARGET KEYWORD: Pick ONE specific long-tail search query that people are actively Googling related to "${topic}". Examples: "best AI tools for [use case] 2026", "[tool] vs [tool] comparison", "how to use AI for [task]", "free AI [category] tools". The title MUST contain this keyword naturally.
2. Title must be under 60 characters for Google SERPs. Include the year (2026) when relevant. Use power words (best, free, guide, vs, how to).
3. Write 1500 to 2500 words. This is NON-NEGOTIABLE. Short posts do not rank. Google's top results average 1,800 words. Include enough depth, examples, and analysis to fill this length naturally. Do NOT pad with filler. Add more sections, more comparisons, more practical advice.
4. Structure with clear H2 headers that include secondary keywords. Google uses H2s for featured snippets.
5. Include at least ONE comparison table, numbered list, or structured data section. These get rich snippets.
6. The excerpt/meta description must be 150-160 characters, include the target keyword, and compel clicks.
7. Include a FAQ-style section at the end with 2-3 questions people actually search for (use "People Also Ask" style questions as H3s with direct answers).
8. Write in HTML format (use <h2>, <h3>, <p>, <ul>/<li>, <blockquote>, <strong>, <em>, <table> tags)
9. Do NOT include <h1> (the title is rendered separately)
10. Reference specific tools, projects, or discussions from the source material when relevant
11. Include 3 to 5 relevant tags (lowercase, single words or hyphenated compounds)
12. Estimate reading time in minutes (typically 6 to 10 for 1500-2500 word posts)
13. INTERNAL LINKING: When you mention a tool that exists on our site, link the FIRST mention using <a href="/tools/SLUG">Tool Name</a>. Include 4-6 tool links per article. Link to our compare page (/compare) or browse page (/tools) where natural. Only link tools from the list below.

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

ANTI-AI-DETECTION INSTRUCTIONS (CRITICAL):
- Write like you're texting a friend, not writing for a magazine
- Use contractions naturally: "don't", "can't", "it's", "I'm", "you're", "that's"
- Add hedging words: "I think", "might be", "in my experience", "could be wrong but"
- Vary sentence length intentionally - mix short punchy sentences with longer ones
- Add specific non-obvious details: "I tried this last Tuesday and..." or "The interface has this weird blue button..."
- Include a "hot take" opinion that some might disagree with
- Use casual language: "honestly", "basically", "actually", "stuff", "things", "kinda"
- Start sentences with "And", "But", "So" for conversational flow
- NEVER use perfect structure - slight imperfections are more human
- Add a personal story or experience, even if slightly fictionalized

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
function qualityCheck(post: GeneratedPost): { pass: boolean; reasons: string[] } {
  const reasons: string[] = []
  const wordCount = post.content.replace(/<[^>]+>/g, '').split(/\s+/).length

  if (wordCount < 1500) reasons.push(`Word count too low: ${wordCount}`)
  if (!post.content.includes('<h3')) reasons.push('Missing FAQ section (no H3 headers)')
  if (/[\u2014\u2013]|(\s-\s)|(--)/g.test(post.content)) reasons.push('Contains dashes after sanitization')
  if (post.tags.length < 3) reasons.push(`Fewer than 3 tags: ${post.tags.length}`)

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

  // Editor rotation: exclude authors of last 3 posts to prevent repeats
  const { data: recentPosts } = await supabase
    .from('blog_posts')
    .select('author_id, topic_category')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(3)

  const recentAuthorIds = new Set((recentPosts ?? []).map((p) => p.author_id))
  const recentTopics = new Set(
    (recentPosts ?? [])
      .slice(0, 2)
      .map((p) => p.topic_category)
      .filter((t): t is string => t != null),
  )

  const allEditors = Object.entries(EDITORS).map(([name, e]) => ({ name, ...e }))
  const eligibleEditors = allEditors.filter((e) => !recentAuthorIds.has(e.id))
  const editor = shuffle(eligibleEditors.length > 0 ? eligibleEditors : allEditors)[0]

  const eligibleTopics = TOPIC_CATEGORIES.filter((t) => !recentTopics.has(t))
  const topic = shuffle(eligibleTopics.length > 0 ? eligibleTopics : TOPIC_CATEGORIES)[0]
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
        result: { editor: editor.name, topic, slot, status: 'skipped: no source material' },
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

    // Sanitize dashes from all display text (not slugs)
    post.title = stripDashes(post.title)
    post.excerpt = stripDashes(post.excerpt)
    post.content = stripDashes(post.content)

    // Post-process: catch any tool mentions the AI prompt missed
    const linkedContent = await addInternalLinks(post.content)

    // Quality gate: failed posts go to draft
    const quality = qualityCheck(post)
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
        slot,
        status: error ? `db error: ${error.message}` : postStatus,
        qualityIssues: quality.reasons.length > 0 ? quality.reasons : undefined,
        sources: { reddit: postReddit.length, youtube: postYoutube.length, twitter: postTwitter.length, transcripts: ytTranscripts.size },
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({
      ok: false,
      published: 0,
      result: { editor: editor.name, topic, slot, status: `error: ${msg.slice(0, 200)}` },
    }, { status: 500 })
  }
}
