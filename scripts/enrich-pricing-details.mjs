/**
 * Enrich pricing_details with meaningful descriptions (no plan names or prices).
 * Scrapes tool websites via Jina Reader, then uses Grok to extract a concise
 * pricing context summary.
 *
 * Usage:
 *   node scripts/enrich-pricing-details.mjs          # dry run (preview)
 *   node scripts/enrich-pricing-details.mjs --apply   # write to DB
 *   node scripts/enrich-pricing-details.mjs --apply --limit=10
 */

import { createClient } from '@supabase/supabase-js'

const JINA_BASE = 'https://r.jina.ai'
const XAI_BASE = 'https://api.x.ai/v1'
const apply = process.argv.includes('--apply')
const limitArg = process.argv.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 50

const c = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\n/g, '').trim(),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\\n/g, '').trim(),
)

async function scrape(url) {
  try {
    const res = await fetch(`${JINA_BASE}/${url}`, {
      headers: { Accept: 'text/plain' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return null
    const text = await res.text()
    return text.slice(0, 8000)
  } catch {
    return null
  }
}

async function extractDescription(toolName, pricingModel, websiteContent, pricingContent) {
  const context = [
    websiteContent ? `== HOMEPAGE ==\n${websiteContent.slice(0, 3000)}` : '',
    pricingContent ? `== PRICING PAGE ==\n${pricingContent.slice(0, 4000)}` : '',
  ].filter(Boolean).join('\n\n')

  if (!context) return null

  const prompt = `You are analyzing the AI tool "${toolName}" (pricing model: ${pricingModel}).

Based on the scraped content below, write a SHORT description (1-2 sentences, max 120 chars) of the tool's pricing approach. Focus on WHAT makes their pricing interesting or notable for someone comparing tools.

GOOD examples:
- "Per-seat pricing with usage caps. 14-day free trial. Annual saves 20%."
- "Credit-based system. Pay per generation, no monthly commitment."
- "Flat monthly fee, unlimited usage. No per-seat charges."
- "Free for individuals. Team plans scale by active users."
- "API usage-based billing. Pay per token, no minimum."
- "Freemium with generous free tier. Pro unlocks advanced models."

BAD examples (DO NOT write these):
- "$20/month for Pro, $40/month for Business" (these are prices, not descriptions)
- "Offers Free, Pro, and Enterprise plans" (too generic, says nothing useful)
- "Affordable pricing for teams" (marketing fluff)

RULES:
- NO dollar amounts or specific prices
- NO plan tier names (Free, Pro, Enterprise)
- Focus on the pricing STRUCTURE, MECHANISM, or NOTABLE FEATURE
- Include trial info, refund policy, or billing quirks if notable
- Max 120 characters
- If you truly cannot determine the pricing approach, respond with just "SKIP"

${context}

Respond with ONLY the description text, nothing else.`

  try {
    const res = await fetch(`${XAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini-fast',
        max_tokens: 200,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const text = (data.choices?.[0]?.message?.content ?? '').trim().replace(/^["']|["']$/g, '')
    if (text === 'SKIP' || text.length < 10) return null
    return text.slice(0, 200)
  } catch {
    return null
  }
}

// Known pricing page URLs for top tools
const PRICING_URLS = {
  'chatgpt': 'https://openai.com/chatgpt/pricing/',
  'claude-code': 'https://www.anthropic.com/pricing',
  'cursor-editor': 'https://www.cursor.com/pricing',
  'midjourney': 'https://www.midjourney.com/account/',
  'midjourney-v7': 'https://www.midjourney.com/account/',
  'github-copilot': 'https://github.com/features/copilot#pricing',
  'perplexity-ai': 'https://www.perplexity.ai/pro',
  'semrush-one': 'https://www.semrush.com/prices/',
  'notion-ai': 'https://www.notion.com/pricing',
  'jasper-brand-voice': 'https://www.jasper.ai/pricing',
  'copy-ai': 'https://www.copy.ai/pricing',
  'elevenlabs-dubbing': 'https://elevenlabs.io/pricing',
  'fireflies-ai': 'https://fireflies.ai/pricing',
  'otter-ai': 'https://otter.ai/pricing',
  'heygen': 'https://www.heygen.com/pricing',
  'descript-ai': 'https://www.descript.com/pricing',
  'canva': 'https://www.canva.com/pricing/',
  'grammarly': 'https://www.grammarly.com/plans',
  'zapier': 'https://zapier.com/pricing',
  'replit': 'https://replit.com/pricing',
  'windsurf': 'https://windsurf.com/pricing',
  'suno': 'https://suno.com/pricing',
  'bolt-new': 'https://bolt.new/pricing',
  'lovable': 'https://lovable.dev/pricing',
  'v0-by-vercel': 'https://v0.dev/pricing',
}

async function main() {
  console.log(`\n🔍 Finding tools that need pricing detail enrichment...\n`)

  // Get tools that need enrichment: empty, N/A, or price-only details
  const { data: tools } = await c
    .from('tools')
    .select('id, name, slug, website_url, pricing_model, pricing_details')
    .eq('status', 'published')
    .order('upvote_count', { ascending: false })
    .limit(200)

  const needsEnrich = (tools || []).filter(t => {
    const d = (t.pricing_details || '').trim()
    if (!d || d === 'N/A') return true
    // Price-only: just "$X/mo" or "From $X" with no real description after
    const stripped = d
      .replace(/free\s*tier[;,.]?\s*/gi, '')
      .replace(/(paid\s+)?from\s+\$[\d,.]+\s*\/?\s*(mo(?:nth)?|yr|year|seat)?[;,.]?\s*/gi, '')
      .replace(/(starts?\s+at\s+)?\$[\d,.]+\s*\/?\s*(mo(?:nth)?|yr|year|seat)?\s*(\([^)]*\))?[;,.]?\s*/gi, '')
      .replace(/free[;,.]?\s*/gi, '')
      .replace(/freemium[;,.]?\s*/gi, '')
      .trim()
    return stripped.length < 10
  })

  console.log(`Found ${needsEnrich.length} tools needing enrichment (processing up to ${limit})\n`)

  let updated = 0
  let skipped = 0

  for (const tool of needsEnrich.slice(0, limit)) {
    process.stdout.write(`  ${tool.name}...`)

    // Try pricing page first, then homepage, then guess /pricing
    const pricingUrl = PRICING_URLS[tool.slug]
    const guessedPricingUrl = tool.website_url
      ? tool.website_url.replace(/\/$/, '') + '/pricing'
      : null

    const [homepageContent, pricingContent, guessedContent] = await Promise.all([
      scrape(tool.website_url),
      pricingUrl ? scrape(pricingUrl) : Promise.resolve(null),
      !pricingUrl && guessedPricingUrl ? scrape(guessedPricingUrl) : Promise.resolve(null),
    ])
    const bestPricingContent = pricingContent || guessedContent

    if (!homepageContent && !bestPricingContent) {
      console.log(' ⏭️  no content scraped')
      skipped++
      continue
    }

    const description = await extractDescription(
      tool.name,
      tool.pricing_model,
      homepageContent,
      bestPricingContent,
    )

    if (!description) {
      console.log(' ⏭️  could not extract description')
      skipped++
      continue
    }

    // Preserve existing price info, append new description
    const existingPrices = (tool.pricing_details || '')
      .match(/(free\s*tier[;,.]?\s*)?((?:paid\s+)?from\s+\$[\d,.]+\s*\/?\s*(?:mo(?:nth)?|yr|year|seat)?[;,.]?\s*)?(?:starts?\s+at\s+)?\$?[\d,.]+\s*\/?\s*(?:mo(?:nth)?|yr|year|seat)?/gi)
    const pricePrefix = existingPrices ? existingPrices[0].trim().replace(/[;,.]$/, '') + '. ' : ''
    const newDetails = pricePrefix + description

    if (apply) {
      const { error } = await c
        .from('tools')
        .update({ pricing_details: newDetails })
        .eq('id', tool.id)
      if (error) {
        console.log(` ❌ DB error: ${error.message}`)
      } else {
        console.log(` ✅ "${newDetails}"`)
        updated++
      }
    } else {
      console.log(` 📝 "${newDetails}"`)
      updated++
    }

    // Rate limit: don't hammer APIs
    await new Promise(r => setTimeout(r, 1500))
  }

  console.log(`\n${apply ? '✅ Applied' : '📝 Preview'}: ${updated} enriched, ${skipped} skipped\n`)
}

main().catch(console.error)
