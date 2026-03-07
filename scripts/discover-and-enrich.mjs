#!/usr/bin/env node
/**
 * AI Tool Discovery & Enrichment Pipeline
 *
 * Discovers new AI tools from Product Hunt (and a free fallback source),
 * scrapes each tool's website via Jina AI Reader, enriches the data with
 * Claude, deduplicates against your existing DB, then inserts into
 * tool_submissions for your admin review.
 *
 * Usage:
 *   node scripts/discover-and-enrich.mjs              # dry run — preview only
 *   node scripts/discover-and-enrich.mjs --submit     # write to tool_submissions
 *   node scripts/discover-and-enrich.mjs --limit=20   # how many tools to process
 *
 * Required env vars (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ANTHROPIC_API_KEY
 *
 * Optional env vars:
 *   PRODUCT_HUNT_ACCESS_TOKEN   — get one at https://www.producthunt.com/v2/oauth/applications
 *                                 (create an app → use client_id + client_secret → client_credentials flow)
 *                                 Without this the script falls back to scraping TAAFT.
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Anthropic from '@anthropic-ai/sdk'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ─── Load .env.local ──────────────────────────────────────────────────────────
try {
  const raw = readFileSync(join(ROOT, '.env.local'), 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
} catch {
  console.warn('⚠  .env.local not found — falling back to system env')
}

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const PH_TOKEN          = process.env.PRODUCT_HUNT_ACCESS_TOKEN

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2)
const DRY_RUN = !args.includes('--submit')
const LIMIT   = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] ?? '10')

// ─── Guard ─────────────────────────────────────────────────────────────────────
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!ANTHROPIC_API_KEY) {
  console.error('❌  Missing ANTHROPIC_API_KEY')
  process.exit(1)
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

// ─── Supabase REST helper ─────────────────────────────────────────────────────
async function sb(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.prefer ? { Prefer: opts.prefer } : {}),
      ...opts.headers,
    },
  })
  if (res.status === 204) return null
  const text = await res.text()
  if (!res.ok) throw new Error(`Supabase ${res.status} on ${path}: ${text}`)
  return text ? JSON.parse(text) : null
}

// ─── Step 1 — Load existing domains (dedup) ───────────────────────────────────
async function getExistingDomains() {
  process.stdout.write('📋  Loading existing domains... ')
  const [tools, subs] = await Promise.all([
    sb('/tools?select=website_url&limit=5000'),
    sb('/tool_submissions?select=website_url&limit=2000'),
  ])
  const domains = new Set()
  for (const row of [...(tools ?? []), ...(subs ?? [])]) {
    try { domains.add(new URL(row.website_url).hostname.replace('www.', '')) } catch {}
  }
  console.log(`${domains.size} found`)
  return domains
}

// ─── Step 2 — Load your categories ───────────────────────────────────────────
async function getCategories() {
  const rows = await sb('/categories?select=id,name,slug&order=name.asc')
  return rows ?? []
}

// ─── Step 3a — Discover: Product Hunt GraphQL API ────────────────────────────
async function discoverFromProductHunt(fetch_n) {
  if (!PH_TOKEN) return []
  console.log('\n🔍  Discovering from Product Hunt...')

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
          }
        }
      }
    }
  `

  try {
    const res = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { n: fetch_n } }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) { console.warn(`  ⚠  PH API returned ${res.status}`); return [] }

    const { data, errors } = await res.json()
    if (errors?.length) { console.warn('  ⚠  PH GraphQL errors:', errors[0].message); return [] }

    const posts = data?.posts?.edges ?? []
    console.log(`  → ${posts.length} posts fetched`)

    return posts.map(({ node }) => ({
      name:        node.name,
      website_url: node.website,
      tagline:     node.tagline,
      description: node.description,
      logo_url:    node.thumbnail?.url ?? null,
      ph_votes:    node.votesCount,
      source:      'product_hunt',
    })).filter(t => t.website_url)

  } catch (err) {
    console.warn(`  ⚠  PH fetch failed: ${err.message}`)
    return []
  }
}

// ─── Step 3b — Discover fallback: Hacker News "Show HN" via Algolia API ───────
// Free, no auth, returns structured JSON with actual URLs.
async function discoverFromHackerNews(fetch_n) {
  console.log('\n🔍  Discovering from Hacker News "Show HN" (fallback)...')
  try {
    const params = new URLSearchParams({
      query: 'show HN AI tool',
      tags: 'story',
      hitsPerPage: String(fetch_n),
    })
    const res = await fetch(`https://hn.algolia.com/api/v1/search?${params}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) { console.warn(`  ⚠  HN API returned ${res.status}`); return [] }

    const { hits } = await res.json()
    console.log(`  → ${hits.length} stories fetched`)

    return hits
      .filter(h => h.url && h.title)
      .map(h => ({
        name:        h.title.replace(/^Show HN:\s*/i, '').trim(),
        website_url: h.url,
        tagline:     null,
        description: null,
        logo_url:    null,
        hn_points:   h.points,
        source:      'hacker_news',
      }))

  } catch (err) {
    console.warn(`  ⚠  HN fetch failed: ${err.message}`)
    return []
  }
}

// ─── Step 4 — Scrape tool's own website via Jina AI Reader ───────────────────
async function scrapeWebsite(url) {
  if (!url) return null
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'markdown' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const text = await res.text()
    return text.slice(0, 4000) // keep prompt lean
  } catch {
    return null
  }
}

// ─── Step 5 — Enrich with Claude ─────────────────────────────────────────────
const VALID_INTEGRATIONS = ['slack', 'notion', 'zapier', 'google-drive', 'github', 'hubspot', 'salesforce', 'figma']
const VALID_USE_CASES    = ['content-creation', 'coding', 'marketing', 'design', 'research', 'video', 'sales', 'customer-support']
const VALID_PRICING      = ['free', 'freemium', 'paid', 'trial', 'contact', 'unknown']

async function enrichWithClaude(tool, siteContent, categories) {
  const categoryList = categories.map(c => `${c.slug} — ${c.name}`).join('\n')

  const prompt = `You are enriching an AI tool listing for a curated directory. Be accurate and concise.

## Tool info
Name: ${tool.name}
URL: ${tool.website_url ?? 'unknown'}
Initial tagline: ${tool.tagline ?? 'N/A'}
Initial description: ${tool.description ?? 'N/A'}

## Website content (first 4000 chars)
${siteContent ?? '(not available)'}

## Available categories
${categoryList}

## Valid integrations (only pick from this list)
${VALID_INTEGRATIONS.join(', ')}

## Valid use_case values (only pick from this list, or null)
${VALID_USE_CASES.join(', ')}

Return ONLY a valid JSON object — no markdown fences, no explanation:
{
  "tagline": "One punchy sentence, max 150 chars. No hype words like 'revolutionary' or 'game-changing'.",
  "description": "2-3 clear sentences about what it does and who it's for. Max 500 chars.",
  "pricing_model": "${VALID_PRICING.join('" | "')}",
  "category_slug": "best matching slug from the categories list above",
  "has_api": true | false,
  "is_open_source": true | false,
  "has_mobile_app": true | false,
  "has_sso": true | false,
  "trains_on_data": true | false,
  "integrations": [],
  "use_case": "one value from the use_case list, or null",
  "notes": "One sentence for the admin reviewer — flag anything unusual, unverifiable, or low quality."
}`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = msg.content[0].text.trim()
      .replace(/^```json?\s*/i, '').replace(/\s*```$/, '')

    const parsed = JSON.parse(raw)

    // Sanitise
    if (!VALID_PRICING.includes(parsed.pricing_model)) parsed.pricing_model = 'unknown'
    if (!VALID_USE_CASES.includes(parsed.use_case))    parsed.use_case = null
    parsed.integrations = (parsed.integrations ?? []).filter(i => VALID_INTEGRATIONS.includes(i))
    parsed.tagline       = (parsed.tagline ?? '').slice(0, 150)
    parsed.description   = (parsed.description ?? '').slice(0, 500)

    return parsed

  } catch (err) {
    console.warn(`    ⚠  Claude failed: ${err.message}`)
    return null
  }
}

// ─── Step 6 — Insert into tool_submissions ───────────────────────────────────
async function submitTool(tool, enriched, categories) {
  const category = categories.find(c => c.slug === enriched.category_slug)

  const notes = [
    enriched.notes ?? '',
    `Auto-discovered via ${tool.source}.`,
    tool.ph_votes   != null ? `Product Hunt votes: ${tool.ph_votes}.`   : '',
    tool.hn_points  != null ? `Hacker News points: ${tool.hn_points}.` : '',
  ].filter(Boolean).join(' ').slice(0, 500)

  const row = {
    name:          tool.name.slice(0, 100),
    website_url:   tool.website_url,
    tagline:       enriched.tagline || tool.tagline?.slice(0, 150) || '',
    description:   enriched.description || tool.description?.slice(0, 2000) || '',
    pricing_model: enriched.pricing_model ?? null,
    logo_url:      tool.logo_url ?? null,
    category_id:   category?.id ?? null,
    notes,
    status:        'pending',
  }

  await sb('/tool_submissions', {
    method: 'POST',
    prefer: 'return=minimal',
    body: JSON.stringify(row),
  })

  return row
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('━'.repeat(55))
  console.log('🤖  AI Tool Discovery & Enrichment Pipeline')
  console.log(`    Mode : ${DRY_RUN ? 'DRY RUN — preview only' : '✅ SUBMIT to tool_submissions'}`)
  console.log(`    Limit: ${LIMIT} tools`)
  console.log('━'.repeat(55))

  const [existingDomains, categories] = await Promise.all([
    getExistingDomains(),
    getCategories(),
  ])

  // ── Discover ─────────────────────────────────────────────────────────────
  let candidates = await discoverFromProductHunt(LIMIT * 3)
  if (candidates.length === 0) candidates = await discoverFromHackerNews(LIMIT * 3)

  // ── Filter already-known domains ──────────────────────────────────────────
  const fresh = []
  for (const c of candidates) {
    if (fresh.length >= LIMIT) break
    if (!c.website_url && !c.taaft_url) continue

    const domain = c.website_url
      ? new URL(c.website_url).hostname.replace('www.', '')
      : null

    if (domain && existingDomains.has(domain)) continue
    fresh.push(c)
  }

  console.log(`\n✨  ${fresh.length} new tool(s) to process (from ${candidates.length} candidates)\n`)

  if (fresh.length === 0) {
    console.log('Nothing new. Try --limit=50 or check your PRODUCT_HUNT_ACCESS_TOKEN.')
    return
  }

  const stats = { submitted: 0, skipped: 0, failed: 0 }

  for (const [i, tool] of fresh.entries()) {
    const tag = `[${i + 1}/${fresh.length}]`
    console.log(`${tag} ${tool.name}`)

    // Scrape
    process.stdout.write('  ⟳ Scraping website...')
    const siteContent = await scrapeWebsite(tool.website_url)
    console.log(siteContent ? ` ✓ (${siteContent.length} chars)` : ' (no content)')

    // Enrich
    process.stdout.write('  ⟳ Enriching with Claude Haiku...')
    const enriched = await enrichWithClaude(tool, siteContent, categories)
    if (!enriched) {
      console.log(' ✗ failed — skipping')
      stats.failed++
      console.log()
      continue
    }
    console.log(' ✓')

    // Preview
    console.log(`  🔗 ${tool.website_url}`)
    console.log(`  📌 ${enriched.tagline}`)
    console.log(`  📄 ${enriched.description}`)
    console.log(`  🏷  Category: ${enriched.category_slug}  |  Pricing: ${enriched.pricing_model}  |  Use case: ${enriched.use_case ?? 'n/a'}`)
    console.log(`  🔧 API:${enriched.has_api?'✓':'✗'}  OpenSource:${enriched.is_open_source?'✓':'✗'}  Mobile:${enriched.has_mobile_app?'✓':'✗'}  SSO:${enriched.has_sso?'✓':'✗'}  TrainsOnData:${enriched.trains_on_data?'✓':'✗'}`)
    if (enriched.integrations?.length) console.log(`  🔗 Integrations: ${enriched.integrations.join(', ')}`)
    console.log(`  📝 ${enriched.notes}`)

    if (!DRY_RUN) {
      try {
        await submitTool(tool, enriched, categories)
        console.log('  ✅ Inserted into tool_submissions')
        stats.submitted++
      } catch (err) {
        console.error(`  ❌ Insert failed: ${err.message}`)
        stats.failed++
      }
    } else {
      stats.skipped++
    }

    console.log()

    // Polite delay between Claude calls to stay well within rate limits
    if (i < fresh.length - 1) await new Promise(r => setTimeout(r, 600))
  }

  console.log('━'.repeat(55))
  console.log(`Done.  Submitted: ${stats.submitted}  |  Dry-skipped: ${stats.skipped}  |  Failed: ${stats.failed}`)
  if (DRY_RUN && stats.skipped > 0) {
    console.log('\n→ Re-run with --submit to write to tool_submissions')
  }
  if (!DRY_RUN && stats.submitted > 0) {
    console.log('\n→ Review new submissions at /admin/submissions')
  }
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err.message)
  process.exit(1)
})
