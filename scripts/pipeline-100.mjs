#!/usr/bin/env node
/**
 * AI Tool Discovery Pipeline — 100 Tools
 *
 * Discovers the latest 100 AI tools not already in your database,
 * enriches them with Grok (xAI, full schema), and inserts directly
 * into the `tools` table as status='pending' for admin review.
 *
 * Usage:
 *   node scripts/pipeline-100.mjs              # dry run — preview only
 *   node scripts/pipeline-100.mjs --submit     # write to tools table
 *   node scripts/pipeline-100.mjs --limit=25   # process fewer tools
 *
 * Required env vars (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   XAI_API_KEY
 *   PRODUCT_HUNT_ACCESS_TOKEN  (optional — falls back to Hacker News)
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

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

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const XAI_KEY          = process.env.XAI_API_KEY
const PH_TOKEN         = process.env.PRODUCT_HUNT_ACCESS_TOKEN

const args    = process.argv.slice(2)
const DRY_RUN = !args.includes('--submit')
const LIMIT   = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] ?? '100')
const BATCH   = 3  // parallel enrichment workers

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!XAI_KEY) {
  console.error('❌  Missing XAI_API_KEY')
  process.exit(1)
}

// ─── Valid enum values (must match DB constraints) ────────────────────────────
const VALID_PRICING      = ['free', 'freemium', 'paid', 'trial', 'contact', 'unknown']
const VALID_USE_CASES    = ['content-creation', 'coding', 'marketing', 'design', 'research', 'video', 'sales', 'customer-support']
const VALID_TEAM_SIZES   = ['solo', 'small-team', 'mid-size', 'enterprise']
const VALID_INTEGRATIONS = ['slack', 'notion', 'zapier', 'google-drive', 'github', 'hubspot', 'salesforce', 'figma']

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

// ─── Slug generator ───────────────────────────────────────────────────────────
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

function uniqueSlug(base, usedSlugs) {
  if (!usedSlugs.has(base)) { usedSlugs.add(base); return base }
  for (let n = 2; n < 9999; n++) {
    const candidate = `${base}-${n}`
    if (!usedSlugs.has(candidate)) { usedSlugs.add(candidate); return candidate }
  }
  const fallback = `${base}-${Date.now()}`
  usedSlugs.add(fallback)
  return fallback
}

// ─── Load existing domains & slugs ───────────────────────────────────────────
async function loadExisting() {
  process.stdout.write('📋  Loading existing data... ')
  const [tools, subs] = await Promise.all([
    sb('/tools?select=website_url,slug&limit=5000'),
    sb('/tool_submissions?select=website_url&limit=2000'),
  ])
  const domains = new Set()
  const slugs   = new Set()
  for (const row of (tools ?? [])) {
    try { domains.add(new URL(row.website_url).hostname.replace('www.', '')) } catch {}
    if (row.slug) slugs.add(row.slug)
  }
  for (const row of (subs ?? [])) {
    try { domains.add(new URL(row.website_url).hostname.replace('www.', '')) } catch {}
  }
  console.log(`${domains.size} domains, ${slugs.size} slugs`)
  return { domains, slugs }
}

// ─── Load categories ──────────────────────────────────────────────────────────
async function loadCategories() {
  const rows = await sb('/categories?select=id,name,slug&order=name.asc')
  return rows ?? []
}

// ─── Discovery: Product Hunt (paginate ALL AI posts, filter on the fly) ───────
// Crawls PH until we have `needed` tools not already in existingDomains,
// or until PH runs out of pages. Stops early to avoid unnecessary requests.
async function discoverFromProductHunt(needed, existingDomains) {
  if (!PH_TOKEN) return []
  console.log('\n🔍  Discovering from Product Hunt (scanning full catalogue)...')

  const PER_PAGE = 50
  const fresh    = []
  const seen     = new Set()
  let cursor     = null
  let page       = 0
  let totalScanned = 0

  while (fresh.length < needed) {
    page++
    const query = `
      query($n: Int!, $after: String) {
        posts(first: $n, order: NEWEST, topic: "artificial-intelligence", after: $after) {
          edges {
            node { name tagline description website votesCount thumbnail { url } }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    `
    try {
      const res = await fetch('https://api.producthunt.com/v2/api/graphql', {
        method: 'POST',
        headers: { Authorization: `Bearer ${PH_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { n: PER_PAGE, after: cursor } }),
        signal: AbortSignal.timeout(20000),
      })
      if (!res.ok) { console.warn(`  ⚠  PH returned ${res.status}`); break }

      const { data, errors } = await res.json()
      if (errors?.length) { console.warn(`  ⚠  PH error: ${errors[0].message}`); break }

      const edges    = data?.posts?.edges ?? []
      const pageInfo = data?.posts?.pageInfo ?? {}
      totalScanned  += edges.length

      for (const { node } of edges) {
        if (!node.website) continue
        let domain
        try { domain = new URL(node.website).hostname.replace('www.', '') } catch { continue }
        if (existingDomains.has(domain)) continue
        if (seen.has(domain)) continue
        seen.add(domain)
        fresh.push({
          name:        node.name,
          website_url: node.website,
          tagline:     node.tagline,
          description: node.description,
          logo_url:    node.thumbnail?.url ?? null,
          ph_votes:    node.votesCount,
          source:      'product_hunt',
        })
      }

      process.stdout.write(`\r  → Page ${page} scanned (${totalScanned} total, ${fresh.length} new found)`)
      if (!pageInfo.hasNextPage) { console.log(); break }
      cursor = pageInfo.endCursor
      await new Promise(r => setTimeout(r, 300))
    } catch (err) {
      console.warn(`\n  ⚠  PH fetch failed: ${err.message}`)
      break
    }
  }

  console.log(`\n  ✓ Scanned ${totalScanned} PH posts → ${fresh.length} new tools`)
  return fresh
}

// ─── Discovery: Hacker News fallback ─────────────────────────────────────────
async function discoverFromHackerNews(target) {
  console.log('\n🔍  Discovering from Hacker News (fallback)...')
  const results = []
  const queries = [
    'show HN AI tool',
    'show HN machine learning SaaS',
    'show HN artificial intelligence',
    'show HN LLM',
  ]

  for (const query of queries) {
    if (results.length >= target * 2) break // over-fetch so caller can dedup
    try {
      const params = new URLSearchParams({ query, tags: 'story', hitsPerPage: '100' })
      const res = await fetch(`https://hn.algolia.com/api/v1/search?${params}`, {
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const { hits } = await res.json()
      for (const h of hits) {
        if (h.url && h.title) {
          results.push({
            name:        h.title.replace(/^Show HN:\s*/i, '').trim(),
            website_url: h.url,
            tagline:     null,
            description: null,
            logo_url:    null,
            hn_points:   h.points,
            source:      'hacker_news',
          })
        }
      }
      console.log(`  → "${query}": ${hits.length} hits`)
    } catch (err) {
      console.warn(`  ⚠  HN fetch failed: ${err.message}`)
    }
  }

  return results
}

// ─── Scrape tool website via Jina AI Reader ───────────────────────────────────
async function scrapeWebsite(url) {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'markdown' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    return (await res.text()).slice(0, 4000)
  } catch {
    return null
  }
}

// ─── Enrich with Grok via xAI (full schema) ──────────────────────────────────
async function enrichWithGrok(tool, siteContent, categories) {
  const categoryList = categories.map(c => `${c.slug} — ${c.name}`).join('\n')

  const prompt = `Enrich this AI tool for a curated public directory. Be factual and precise.

## Tool
Name: ${tool.name}
URL: ${tool.website_url}
Tagline hint: ${tool.tagline ?? 'N/A'}
Description hint: ${tool.description ?? 'N/A'}

## Website content (scraped)
${siteContent ?? '(not available — use the name/URL/hints above)'}

## Categories — pick the best slug
${categoryList}

## Allowed values
pricing_model   : ${VALID_PRICING.join(' | ')}
use_case values : ${VALID_USE_CASES.join(' | ')}
team_size values: ${VALID_TEAM_SIZES.join(' | ')}
integrations    : ${VALID_INTEGRATIONS.join(' | ')}

Return ONLY valid JSON (no markdown, no explanation):
{
  "tagline": "One punchy sentence ≤150 chars. No hype words (revolutionary, game-changing, etc.).",
  "description": "2-3 sentences about what it does and who it is for. ≤500 chars.",
  "pricing_model": "<one valid pricing_model>",
  "pricing_details": "<brief pricing summary e.g. 'Free tier: 10 requests/day. Pro $19/mo. Enterprise: contact sales.' — or null>",
  "category_slug": "<best matching category slug>",
  "use_case": "<single best use_case value>",
  "use_cases": ["<up to 3 applicable use_case values>"],
  "team_size": "<single best team_size value>",
  "has_api": true | false,
  "is_open_source": true | false,
  "has_mobile_app": true | false,
  "has_sso": true | false,
  "trains_on_data": true | false,
  "integrations": ["<valid integration slugs — only what is clearly supported>"],
  "notes": "One sentence for the admin reviewer. Flag low quality, adult content, non-AI tools, or anything uncertain."
}`

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${XAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`xAI ${res.status}: ${err}`)
    }

    const data = await res.json()
    const raw  = data.choices[0].message.content.trim()
      .replace(/^```json?\s*/i, '').replace(/\s*```$/, '')

    const p = JSON.parse(raw)

    // Sanitize all fields against valid enums
    if (!VALID_PRICING.includes(p.pricing_model))    p.pricing_model = 'unknown'
    if (!VALID_USE_CASES.includes(p.use_case))       p.use_case = null
    if (!VALID_TEAM_SIZES.includes(p.team_size))     p.team_size = null
    p.use_cases    = (p.use_cases ?? []).filter(u => VALID_USE_CASES.includes(u)).slice(0, 3)
    p.integrations = (p.integrations ?? []).filter(i => VALID_INTEGRATIONS.includes(i))
    p.tagline      = (p.tagline ?? '').slice(0, 150)
    p.description  = (p.description ?? '').slice(0, 500)

    return p
  } catch (err) {
    console.warn(`    ⚠  Grok failed: ${err.message}`)
    return null
  }
}

// ─── Build and insert the tools row ──────────────────────────────────────────
async function insertTool(tool, enriched, categories, slugs) {
  // Resolve category — fall back to first category alphabetically if slug not found
  const category =
    categories.find(c => c.slug === enriched.category_slug) ?? categories[0]

  if (!category) throw new Error('No categories in database')

  const slug = uniqueSlug(slugify(tool.name), slugs)

  const row = {
    name:            tool.name.slice(0, 100),
    slug,
    tagline:         enriched.tagline    || tool.tagline?.slice(0, 150)    || `AI tool: ${tool.name}`,
    description:     enriched.description || tool.description?.slice(0, 500) || '',
    website_url:     tool.website_url,
    logo_url:        tool.logo_url ?? null,
    screenshot_urls: [],
    category_id:     category.id,
    pricing_model:   enriched.pricing_model ?? 'unknown',
    pricing_details: enriched.pricing_details ?? null,
    use_case:        enriched.use_case ?? null,
    use_cases:       enriched.use_cases ?? [],
    team_size:       enriched.team_size ?? null,
    integrations:    enriched.integrations ?? [],
    status:          'pending',
  }

  await sb('/tools', {
    method: 'POST',
    prefer: 'return=minimal',
    body: JSON.stringify(row),
  })

  return row
}

// ─── Process a single tool (scrape → enrich → insert) ────────────────────────
async function processTool(tool, displayIdx, total, categories, slugs, stats) {
  const tag = `[${String(displayIdx).padStart(3)}/${total}]`
  console.log(`${tag} ${tool.name}  (${tool.source})`)

  // Scrape
  const siteContent = await scrapeWebsite(tool.website_url)
  const scrapeNote  = siteContent ? `${siteContent.length}c` : 'no content'

  // Enrich
  const enriched = await enrichWithGrok(tool, siteContent, categories)
  if (!enriched) {
    console.log(`  ✗ Grok enrichment failed [${scrapeNote}] — skipping\n`)
    stats.failed++
    return
  }

  console.log(`  📌 [${scrapeNote}] ${enriched.tagline}`)
  console.log(`  🏷  ${enriched.category_slug ?? 'no-category'} | ${enriched.pricing_model} | ${enriched.use_case ?? '—'} | ${enriched.team_size ?? '—'}`)
  if (enriched.integrations?.length) console.log(`  🔧 ${enriched.integrations.join(', ')}`)
  console.log(`  📝 ${enriched.notes}`)

  if (!DRY_RUN) {
    try {
      const row = await insertTool(tool, enriched, categories, slugs)
      console.log(`  ✅ Inserted as "${row.slug}" (pending)\n`)
      stats.submitted++
    } catch (err) {
      console.error(`  ❌ Insert failed: ${err.message}\n`)
      stats.failed++
    }
  } else {
    console.log('  — Dry run — not inserting\n')
    stats.skipped++
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('━'.repeat(60))
  console.log('🤖  AI Tool Discovery Pipeline — 100 Tools')
  console.log(`    Mode  : ${DRY_RUN ? 'DRY RUN (no DB writes)' : '✅ SUBMIT → tools table'}`)
  console.log(`    Limit : ${LIMIT} tools`)
  console.log(`    Batch : ${BATCH} parallel workers`)
  console.log('━'.repeat(60))

  // Load existing data and categories in parallel
  const [{ domains, slugs }, categories] = await Promise.all([
    loadExisting(),
    loadCategories(),
  ])
  console.log(`📂  ${categories.length} categories loaded`)

  // ── Discovery: PH filters against existing domains on the fly ────────────
  // Scans the full PH AI catalogue until LIMIT new tools are found.
  let fresh = await discoverFromProductHunt(LIMIT, domains)

  // ── Fallback to HN if PH came up short ────────────────────────────────────
  if (fresh.length < LIMIT) {
    console.log(`\n⚠  PH only found ${fresh.length}/${LIMIT} new tools — topping up from Hacker News...`)
    const hn = await discoverFromHackerNews(LIMIT - fresh.length)
    // dedup HN results against domains + fresh
    const seen = new Set(fresh.map(t => {
      try { return new URL(t.website_url).hostname.replace('www.', '') } catch { return null }
    }).filter(Boolean))
    for (const t of hn) {
      if (fresh.length >= LIMIT) break
      if (!t.website_url) continue
      let domain
      try { domain = new URL(t.website_url).hostname.replace('www.', '') } catch { continue }
      if (domains.has(domain) || seen.has(domain)) continue
      seen.add(domain)
      fresh.push(t)
    }
  }

  // Trim to limit
  fresh = fresh.slice(0, LIMIT)

  console.log(`\n✨  ${fresh.length} new tool(s) to process\n`)

  if (fresh.length === 0) {
    console.log('Nothing new to process. Check PRODUCT_HUNT_ACCESS_TOKEN.')
    return
  }

  // ── Process in parallel batches ────────────────────────────────────────────
  const stats = { submitted: 0, skipped: 0, failed: 0 }

  for (let i = 0; i < fresh.length; i += BATCH) {
    const batch = fresh.slice(i, i + BATCH)

    await Promise.all(
      batch.map((tool, j) =>
        processTool(tool, i + j + 1, fresh.length, categories, slugs, stats)
      )
    )

    // Brief pause between batches to respect API rate limits
    if (i + BATCH < fresh.length) await new Promise(r => setTimeout(r, 600))
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('━'.repeat(60))
  console.log('Done.')
  console.log(`  Submitted : ${stats.submitted}`)
  console.log(`  Dry-skip  : ${stats.skipped}`)
  console.log(`  Failed    : ${stats.failed}`)

  if (DRY_RUN && stats.skipped > 0) {
    console.log('\n→ Re-run with --submit to write to the tools table')
  }
  if (!DRY_RUN && stats.submitted > 0) {
    console.log('\n→ Review new tools at /admin/tools?status=pending')
  }
}

main().catch(err => {
  console.error('\n💥 Fatal:', err.message)
  process.exit(1)
})
