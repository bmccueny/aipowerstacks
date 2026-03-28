/**
 * SEO Blog Post Generator
 *
 * Generates SEO-optimized blog post structures with:
 * - Title targeting the keyword
 * - Meta description (under 160 chars)
 * - H2/H3 outline
 * - Internal links to relevant tool pages
 *
 * Usage:
 *   node scripts/generate-seo-posts.mjs                    # Generate all pre-defined topics
 *   node scripts/generate-seo-posts.mjs "custom keyword"   # Generate for a specific topic
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq < 1) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      val = val.replace(/\\n$/, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch { /* .env.local missing is fine */ }
}
loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const PRE_DEFINED_TOPICS = [
  {
    keyword: 'Best AI Tools for Small Business 2026',
    slug: 'best-ai-tools-small-business-2026',
    focus: 'small business',
    relatedCategories: ['productivity', 'marketing', 'writing', 'customer-support'],
  },
  {
    keyword: 'ChatGPT vs Claude vs Gemini: Which AI is Best?',
    slug: 'chatgpt-vs-claude-vs-gemini-comparison',
    focus: 'ai comparison',
    relatedTools: ['chatgpt', 'claude', 'gemini'],
  },
  {
    keyword: 'Free AI Tools That Replace Expensive Software',
    slug: 'free-ai-tools-replace-expensive-software',
    focus: 'free tools',
    pricingFilter: 'free',
  },
  {
    keyword: 'How to Reduce Your AI Tool Spending',
    slug: 'reduce-ai-tool-spending',
    focus: 'cost optimization',
    relatedCategories: ['productivity', 'writing', 'coding'],
  },
  {
    keyword: 'AI Tools for Content Creators: Complete Guide',
    slug: 'ai-tools-content-creators-guide',
    focus: 'content creation',
    relatedCategories: ['writing', 'image-generation', 'video', 'social-media'],
  },
]

async function fetchToolsByCategory(categorySlugs) {
  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug, name')
    .in('slug', categorySlugs)

  if (!categories?.length) return []

  const categoryIds = categories.map(c => c.id)
  const { data: tools } = await supabase
    .from('tools')
    .select('slug, name, tagline, pricing_model, category_id')
    .eq('status', 'published')
    .in('category_id', categoryIds)
    .order('review_count', { ascending: false })
    .limit(20)

  return (tools ?? []).map(t => ({
    ...t,
    categoryName: categories.find(c => c.id === t.category_id)?.name ?? '',
  }))
}

async function fetchToolsBySlugs(slugs) {
  const { data } = await supabase
    .from('tools')
    .select('slug, name, tagline, pricing_model')
    .eq('status', 'published')
    .in('slug', slugs)

  return data ?? []
}

async function fetchFreeTools() {
  const { data } = await supabase
    .from('tools')
    .select('slug, name, tagline, pricing_model, category_id')
    .eq('status', 'published')
    .eq('pricing_model', 'free')
    .order('review_count', { ascending: false })
    .limit(20)

  return data ?? []
}

function generateInternalLinks(tools) {
  return tools.map(t => ({
    text: t.name,
    url: `/tools/${t.slug}`,
    context: t.tagline || '',
  }))
}

function generateOutline(keyword, tools, focus) {
  const toolLinks = generateInternalLinks(tools.slice(0, 10))

  // Build H2/H3 structure based on focus
  const sections = []

  sections.push({
    h2: `Why ${keyword.split(':')[0].trim()} Matters in 2026`,
    h3s: [
      'The Current AI Tool Landscape',
      'What Changed This Year',
    ],
  })

  if (focus === 'ai comparison') {
    sections.push(
      { h2: 'Head-to-Head Comparison', h3s: ['Features & Capabilities', 'Pricing Breakdown', 'Best Use Cases'] },
      { h2: 'Which AI Should You Choose?', h3s: ['For Developers', 'For Writers', 'For Business Users'] },
    )
  } else if (focus === 'free tools') {
    sections.push(
      { h2: 'Best Free AI Tools by Category', h3s: tools.slice(0, 5).map(t => t.name) },
      { h2: 'Free vs Paid: What You Actually Lose', h3s: ['Feature Limitations', 'Usage Caps', 'When to Upgrade'] },
    )
  } else if (focus === 'cost optimization') {
    sections.push(
      { h2: 'Audit Your Current AI Subscriptions', h3s: ['Track What You Actually Use', 'Identify Overlap', 'Calculate True Cost per Task'] },
      { h2: 'Money-Saving Strategies', h3s: ['Bundle vs Individual Subscriptions', 'Free Tier Maximization', 'Open Source Alternatives'] },
    )
  } else if (focus === 'content creation') {
    sections.push(
      { h2: 'AI Writing Tools', h3s: ['Blog & Article Writing', 'Social Media Copy', 'Email Marketing'] },
      { h2: 'AI Visual Content Tools', h3s: ['Image Generation', 'Video Creation', 'Thumbnail & Design'] },
      { h2: 'Building Your AI Content Stack', h3s: ['Beginner Stack (Free)', 'Pro Stack ($50/mo)', 'Agency Stack'] },
    )
  } else {
    sections.push(
      { h2: `Top AI Tools for ${focus.charAt(0).toUpperCase() + focus.slice(1)}`, h3s: tools.slice(0, 5).map(t => t.name) },
      { h2: 'How to Choose the Right Tool', h3s: ['Key Features to Look For', 'Pricing Considerations', 'Integration Requirements'] },
    )
  }

  sections.push({
    h2: 'Final Verdict & Recommendations',
    h3s: ['Our Top Pick', 'Best Value', 'Best Free Option'],
  })

  return { sections, internalLinks: toolLinks }
}

async function generatePost(topicConfig) {
  const { keyword, slug, focus, relatedCategories, relatedTools, pricingFilter } = topicConfig

  let tools = []
  if (relatedTools) {
    tools = await fetchToolsBySlugs(relatedTools)
  } else if (pricingFilter === 'free') {
    tools = await fetchFreeTools()
  } else if (relatedCategories) {
    tools = await fetchToolsByCategory(relatedCategories)
  }

  const metaDescription = generateMetaDescription(keyword)
  const { sections, internalLinks } = generateOutline(keyword, tools, focus)

  return {
    title: keyword,
    slug,
    meta_description: metaDescription,
    status: 'draft',
    outline: sections,
    internal_links: internalLinks,
    related_tools: tools.map(t => ({ slug: t.slug, name: t.name })),
    estimated_word_count: sections.reduce((acc, s) => acc + 300 + s.h3s.length * 200, 0),
    target_keyword: keyword.toLowerCase(),
    created_at: new Date().toISOString(),
  }
}

function generateMetaDescription(keyword) {
  const templates = [
    `Discover the ${keyword.toLowerCase()}. Compare features, pricing, and real user reviews to find the perfect fit.`,
    `${keyword} — expert-tested recommendations with honest pros, cons, and pricing breakdowns.`,
    `Looking for ${keyword.toLowerCase().replace('best ', '')}? Our curated guide covers top picks, free options, and insider tips.`,
  ]

  // Pick the first template that's under 160 chars
  for (const tmpl of templates) {
    if (tmpl.length <= 160) return tmpl
  }
  return templates[0].slice(0, 157) + '...'
}

async function main() {
  const customTopic = process.argv[2]

  if (customTopic) {
    const slug = customTopic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const post = await generatePost({
      keyword: customTopic,
      slug,
      focus: 'general',
      relatedCategories: ['productivity', 'writing', 'coding'],
    })

    console.log(JSON.stringify(post, null, 2))
    return
  }

  console.log(`Generating SEO post outlines for ${PRE_DEFINED_TOPICS.length} topics...\n`)

  const results = []
  for (const topic of PRE_DEFINED_TOPICS) {
    try {
      const post = await generatePost(topic)
      results.push(post)
      console.log(`✅ ${topic.keyword} (${post.internal_links.length} internal links, ~${post.estimated_word_count} words)`)
    } catch (err) {
      console.error(`❌ ${topic.keyword}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  console.log('\n--- Generated Post Outlines ---\n')
  console.log(JSON.stringify(results, null, 2))
}

main().catch(err => {
  console.error('Post generation failed:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
