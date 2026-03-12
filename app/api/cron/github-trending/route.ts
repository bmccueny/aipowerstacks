import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── GitHub trending scraper ──────────────────────────────────────────────────
// Scrapes GitHub trending repos filtered by AI/ML topics, then auto-publishes
// them as tools in the directory. Runs as a cron job.
//
// Supports optional GITHUB_TOKEN env var for higher API rate limits.
// Without a token the GitHub Search API allows ~10 requests/minute.

const SEARCH_QUERIES = [
  'topic:artificial-intelligence',
  'topic:llm',
  'topic:generative-ai',
  'topic:machine-learning',
  'topic:deep-learning',
  'topic:langchain',
  'topic:ai-agent',
  'topic:stable-diffusion',
  'topic:openai',
  'topic:chatgpt',
  'topic:large-language-models',
  'topic:text-to-image',
  'topic:text-to-speech',
  'topic:speech-recognition',
  'topic:computer-vision',
  'topic:ai-tools',
  'topic:rag',
  'topic:transformers',
  'topic:diffusion-models',
]

// Map GitHub topics/keywords to our category slugs
const TOPIC_TO_CATEGORY: Record<string, string> = {
  // Chat & Assistants
  'chatbot': 'ai-chat',
  'chatgpt': 'ai-chat',
  'ai-assistant': 'ai-chat',
  'conversational-ai': 'ai-chat',
  'llm': 'ai-chat',
  'large-language-models': 'ai-chat',
  'ai-agent': 'ai-chat',
  'langchain': 'ai-chat',
  'rag': 'ai-chat',

  // Image Generation
  'text-to-image': 'image-generation',
  'stable-diffusion': 'image-generation',
  'image-generation': 'image-generation',
  'diffusion-models': 'image-generation',
  'midjourney': 'image-generation',
  'dall-e': 'image-generation',
  'image-synthesis': 'image-generation',
  'controlnet': 'image-generation',
  'comfyui': 'image-generation',

  // Coding & Development
  'code-generation': 'coding',
  'copilot': 'coding',
  'code-assistant': 'coding',
  'developer-tools': 'coding',
  'devtools': 'coding',
  'ide': 'coding',
  'code-review': 'coding',
  'coding-assistant': 'coding',

  // Writing
  'text-generation': 'writing',
  'writing-assistant': 'writing',
  'copywriting': 'writing',
  'content-generation': 'writing',

  // Video
  'text-to-video': 'video',
  'video-generation': 'video',
  'video-editing': 'video',
  'deepfake': 'video',

  // Audio & Music
  'text-to-speech': 'audio',
  'tts': 'audio',
  'speech-synthesis': 'audio',
  'music-generation': 'audio',
  'audio-generation': 'audio',
  'voice-cloning': 'audio',
  'speech-recognition': 'voice',
  'asr': 'voice',
  'whisper': 'voice',
  'stt': 'voice',

  // Automation
  'automation': 'automation',
  'workflow': 'automation',
  'ai-automation': 'automation',
  'rpa': 'automation',

  // Research & Analysis
  'machine-learning': 'research',
  'deep-learning': 'research',
  'artificial-intelligence': 'research',
  'neural-network': 'research',
  'transformer': 'research',
  'transformers': 'research',
  'pytorch': 'research',
  'tensorflow': 'research',
  'computer-vision': 'research',
  'nlp': 'research',
  'natural-language-processing': 'research',
  'reinforcement-learning': 'research',

  // Data & Analytics
  'data-science': 'data-analytics',
  'data-analysis': 'data-analytics',
  'analytics': 'data-analytics',
  'data-visualization': 'data-analytics',

  // Design
  'ui-design': 'design',
  'design-tools': 'design',
  'figma': 'design',

  // Productivity
  'productivity': 'productivity',
  'note-taking': 'productivity',
  'knowledge-base': 'productivity',
  'personal-assistant': 'productivity',

  // 3D
  '3d-generation': '3d-animation',
  'nerf': '3d-animation',
  '3d-reconstruction': '3d-animation',
  'gaussian-splatting': '3d-animation',

  // Education
  'education': 'education',
  'learning': 'education',
  'tutorial': 'education',

  // Business
  'marketing': 'business',
  'sales': 'business',
  'crm': 'business',

  // SEO
  'seo': 'seo',
  'content-marketing': 'seo',

  // Translation
  'translation': 'translation',
  'machine-translation': 'translation',

  // Summarization
  'summarization': 'summarization',
  'text-summarization': 'summarization',

  // Search
  'search-engine': 'search',
  'semantic-search': 'search',
  'vector-search': 'search',

  // Customer Support
  'customer-support': 'customer-support',
  'helpdesk': 'customer-support',

  // Healthcare
  'healthcare': 'healthcare',
  'medical-ai': 'healthcare',
  'biomedical': 'healthcare',

  // Finance
  'fintech': 'finance',
  'trading': 'finance',
  'algorithmic-trading': 'finance',

  // Avatars
  'avatar': 'avatars',
  'face-generation': 'avatars',

  // Social Media
  'social-media': 'social-media',

  // Email
  'email': 'email',

  // Catch-all AI tools
  'ai-tools': 'productivity',
  'generative-ai': 'ai-chat',
  'openai': 'ai-chat',
}

// Fallback category when no topic matches
const DEFAULT_CATEGORY_SLUG = 'research'

// Minimum stars to auto-publish
const MIN_STARS = 100

// Max repos to process per cron run
const MAX_REPOS_PER_RUN = 10

// How many days back to look for repos (created in the last N days)
const CREATED_WITHIN_DAYS = 30

type GitHubRepo = {
  full_name: string
  name: string
  description: string | null
  html_url: string
  homepage: string | null
  stargazers_count: number
  topics: string[]
  language: string | null
  license: { spdx_id: string } | null
  owner: {
    login: string
    avatar_url: string
  }
  created_at: string
  updated_at: string
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

function mapTopicsToCategory(topics: string[]): string {
  // Count votes per category from matching topics
  const votes: Record<string, number> = {}
  for (const topic of topics) {
    const catSlug = TOPIC_TO_CATEGORY[topic]
    if (catSlug) {
      votes[catSlug] = (votes[catSlug] || 0) + 1
    }
  }

  // Return the category with the most topic matches
  const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] ?? DEFAULT_CATEGORY_SLUG
}

function buildTagline(repo: GitHubRepo): string {
  if (repo.description) {
    // Clean up and truncate
    const cleaned = repo.description
      .replace(/:\w+:/g, '') // Remove emoji shortcodes
      .replace(/\s+/g, ' ')
      .trim()
    if (cleaned.length <= 150) return cleaned
    return cleaned.slice(0, 147) + '...'
  }
  return `Open source ${repo.language || 'AI'} tool by ${repo.owner.login}`
}

function buildDescription(repo: GitHubRepo): string {
  const parts: string[] = []

  if (repo.description) {
    parts.push(repo.description.replace(/:\w+:/g, '').replace(/\s+/g, ' ').trim())
  }

  parts.push(
    `${repo.full_name} is an open source project on GitHub with ${repo.stargazers_count.toLocaleString()} stars.`
  )

  if (repo.language) {
    parts.push(`Built primarily in ${repo.language}.`)
  }

  if (repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION') {
    parts.push(`Licensed under ${repo.license.spdx_id}.`)
  }

  if (repo.topics.length > 0) {
    parts.push(`Topics: ${repo.topics.slice(0, 10).join(', ')}.`)
  }

  return parts.join(' ')
}

function determinePricingModel(repo: GitHubRepo): 'free' | 'freemium' {
  // Most open-source repos are free, but some have paid hosted versions
  const desc = (repo.description || '').toLowerCase()
  const homepage = (repo.homepage || '').toLowerCase()
  if (
    desc.includes('pricing') ||
    desc.includes('enterprise') ||
    desc.includes('pro plan') ||
    desc.includes('subscription')
  ) {
    return 'freemium'
  }
  if (homepage && !homepage.includes('github.com')) {
    // Has a non-GitHub homepage, might have a paid hosted version
    return 'freemium'
  }
  return 'free'
}

async function searchGitHub(
  query: string,
  headers: Record<string, string>
): Promise<GitHubRepo[]> {
  const since = new Date()
  since.setDate(since.getDate() - CREATED_WITHIN_DAYS)
  const dateStr = since.toISOString().split('T')[0]

  const searchQuery = `${query} stars:>=${MIN_STARS} created:>=${dateStr}`
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc&per_page=10`

  const response = await fetch(url, { headers })
  if (!response.ok) {
    const text = await response.text()
    console.error(`GitHub API ${response.status} for query "${query}": ${text.slice(0, 200)}`)
    return []
  }

  const data = await response.json()
  return (data.items || []) as GitHubRepo[]
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ghToken = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'AIPowerStacks-Bot/1.0',
  }
  if (ghToken) {
    headers.Authorization = `Bearer ${ghToken}`
  }

  const admin = createAdminClient()

  // 1. Load category ID map from DB
  const { data: categories, error: catError } = await admin
    .from('categories')
    .select('id, slug')

  if (catError || !categories) {
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 })
  }

  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]))

  // 2. Load existing tool website_urls to deduplicate
  const { data: existingTools } = await admin
    .from('tools')
    .select('website_url, slug')

  const existingUrls = new Set(
    (existingTools || []).map((t) => t.website_url?.toLowerCase())
  )
  const existingSlugs = new Set(
    (existingTools || []).map((t) => t.slug)
  )

  // 3. Search GitHub across all our queries
  // Stagger queries to avoid rate limits (pick 3 random queries per run)
  const shuffled = [...SEARCH_QUERIES].sort(() => Math.random() - 0.5)
  const selectedQueries = shuffled.slice(0, 3)

  const allRepos: GitHubRepo[] = []
  const seenRepos = new Set<string>()

  for (const query of selectedQueries) {
    const repos = await searchGitHub(query, headers)
    for (const repo of repos) {
      if (!seenRepos.has(repo.full_name)) {
        seenRepos.add(repo.full_name)
        allRepos.push(repo)
      }
    }
    // Rate limit pause between API calls
    await new Promise((r) => setTimeout(r, 2000))
  }

  if (allRepos.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No repos found from GitHub trending search',
      queries: selectedQueries,
    })
  }

  // 4. Sort by stars descending, take top N
  allRepos.sort((a, b) => b.stargazers_count - a.stargazers_count)
  const topRepos = allRepos.slice(0, MAX_REPOS_PER_RUN)

  // 5. Filter out repos we already have
  const newRepos = topRepos.filter((repo) => {
    const ghUrl = repo.html_url.toLowerCase()
    const homepage = repo.homepage?.toLowerCase() || ''
    const slug = slugify(repo.name)

    // Check if we already have this repo by GitHub URL, homepage, or slug
    if (existingUrls.has(ghUrl)) return false
    if (homepage && existingUrls.has(homepage)) return false
    if (existingSlugs.has(slug)) return false

    return true
  })

  if (newRepos.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'All discovered repos already exist in directory',
      searched: allRepos.length,
      queries: selectedQueries,
    })
  }

  // 6. Insert new tools
  const inserted: string[] = []
  const errors: string[] = []
  const nowIso = new Date().toISOString()

  for (const repo of newRepos) {
    const categorySlug = mapTopicsToCategory(repo.topics)
    const categoryId = categoryMap.get(categorySlug) || categoryMap.get(DEFAULT_CATEGORY_SLUG)

    if (!categoryId) {
      errors.push(`${repo.full_name}: no category ID for slug "${categorySlug}"`)
      continue
    }

    let slug = slugify(repo.name)
    // Handle slug collision by appending owner
    if (existingSlugs.has(slug)) {
      slug = slugify(`${repo.owner.login}-${repo.name}`)
    }
    if (existingSlugs.has(slug)) {
      errors.push(`${repo.full_name}: slug collision "${slug}"`)
      continue
    }

    const websiteUrl = repo.homepage && repo.homepage.trim().length > 0
      ? repo.homepage.trim()
      : repo.html_url

    const toolData = {
      name: repo.name,
      slug,
      tagline: buildTagline(repo),
      description: buildDescription(repo),
      website_url: websiteUrl,
      logo_url: repo.owner.avatar_url,
      category_id: categoryId,
      pricing_model: determinePricingModel(repo),
      is_open_source: true,
      has_api: repo.topics.some((t) =>
        ['api', 'sdk', 'library', 'framework', 'rest-api', 'graphql'].includes(t)
      ),
      status: 'published' as const,
      published_at: nowIso,
      approved_at: nowIso,
    }

    const { error: insertError } = await admin
      .from('tools')
      .insert(toolData)

    if (insertError) {
      errors.push(`${repo.full_name}: ${insertError.message}`)
    } else {
      inserted.push(`${repo.full_name} (${repo.stargazers_count} stars) -> ${slug}`)
      existingSlugs.add(slug)
      existingUrls.add(websiteUrl.toLowerCase())
    }
  }

  return NextResponse.json({
    success: true,
    queries: selectedQueries,
    searched: allRepos.length,
    newFound: newRepos.length,
    inserted: inserted.length,
    insertedTools: inserted,
    errors: errors.length > 0 ? errors : undefined,
    ranAt: nowIso,
  })
}
