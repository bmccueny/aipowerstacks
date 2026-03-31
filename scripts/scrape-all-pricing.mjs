import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'child_process'
import { readFileSync, existsSync, mkdirSync } from 'fs'
import { scrapeUrl } from './lib/scrape.mjs'

const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const XAI = 'https://api.x.ai/v1'
const KEY = process.env.XAI_API_KEY

const { data: existingTiers } = await c.from('tool_pricing_tiers').select('tool_id')
const hasTiers = new Set((existingTiers || []).map(t => t.tool_id))

const { data: allTools } = await c.from('tools').select('id, name, slug, website_url, pricing_model, pricing_details')
  .eq('status', 'published').order('name')

const missing = allTools.filter(t => !hasTiers.has(t.id))
console.log(`Processing ${missing.length} tools without pricing tiers...\n`)

const dir = '.firecrawl/scratchpad/pricing'
mkdirSync(dir, { recursive: true })

let totalInserted = 0
let processed = 0
const batchSize = 10

for (let batch = 0; batch < missing.length; batch += batchSize) {
  const batchTools = missing.slice(batch, batch + batchSize)
  const toolData = []

  for (const tool of batchTools) {
    processed++
    const url = tool.website_url
    const isGithub = url?.includes('github.com')
    const isHuggingface = url?.includes('huggingface.co')

    if (isGithub || isHuggingface || tool.pricing_model === 'free') {
      toolData.push({
        tool,
        tiers: [{ tier_name: 'Free', monthly_price: 0, features: tool.pricing_model === 'free' ? 'All features included' : 'Open source, run locally' }]
      })
      continue
    }

    let scrapedContent = ''
    if (url && !isGithub) {
      const pricingUrl = url.replace(/\/$/, '') + '/pricing'
      // Try pricing page first, then main page
      const content = await scrapeUrl(pricingUrl, { maxChars: 2000 }) || await scrapeUrl(url, { maxChars: 2000 })
      if (content && content.length > 100) scrapedContent = content
    }

    toolData.push({ tool, scrapedContent })
  }

  const toolsNeedingAI = toolData.filter(t => !t.tiers && t.scrapedContent)
  const toolsNoData = toolData.filter(t => !t.tiers && !t.scrapedContent)

  if (toolsNeedingAI.length > 0) {
    const prompt = `Extract pricing tiers from these tool descriptions. Return a JSON object where keys are tool slugs and values are arrays of { tier_name, monthly_price, features }.

Rules:
- monthly_price must be a number (0 for free tiers)
- If annual pricing only, divide by 12 and round
- Include ALL tiers mentioned (Free, Basic, Pro, Business, Enterprise, etc.)
- If no pricing found, use the pricing_model to estimate

Tools:
${toolsNeedingAI.map(t => `
--- ${t.tool.slug} (${t.tool.name}, pricing_model: ${t.tool.pricing_model}) ---
${t.tool.pricing_details || ''}
${t.scrapedContent}
`).join('\n')}

Return ONLY valid JSON. No explanation.`

    try {
      const res = await fetch(`${XAI}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ model: 'grok-3-mini-fast', max_tokens: 4000, temperature: 0.2, messages: [{ role: 'user', content: prompt }] }),
      })

      if (res.ok) {
        const data = await res.json()
        const text = (data.choices?.[0]?.message?.content ?? '').trim()
        const match = text.match(/\{[\s\S]*\}/)
        if (match) {
          try {
            const parsed = JSON.parse(match[0])
            for (const t of toolsNeedingAI) {
              if (parsed[t.tool.slug]) t.tiers = parsed[t.tool.slug]
            }
          } catch {}
        }
      }
    } catch {}
  }

  // Fill in remaining with generic tiers
  for (const t of [...toolsNoData, ...toolsNeedingAI.filter(t => !t.tiers)]) {
    if (t.tiers) continue
    if (t.tool.pricing_model === 'freemium') {
      t.tiers = [{ tier_name: 'Free', monthly_price: 0, features: 'Basic features' }, { tier_name: 'Pro', monthly_price: 20, features: 'Full features' }]
    } else if (t.tool.pricing_model === 'paid') {
      t.tiers = [{ tier_name: 'Starter', monthly_price: 10, features: 'Basic plan' }, { tier_name: 'Pro', monthly_price: 25, features: 'Full features' }]
    } else if (t.tool.pricing_model === 'trial') {
      t.tiers = [{ tier_name: 'Free Trial', monthly_price: 0, features: 'Limited trial' }, { tier_name: 'Paid', monthly_price: 20, features: 'Full access' }]
    } else if (t.tool.pricing_model === 'contact') {
      t.tiers = [{ tier_name: 'Enterprise', monthly_price: 0, features: 'Contact for pricing' }]
    } else {
      t.tiers = [{ tier_name: 'Free', monthly_price: 0, features: 'All features' }]
    }
  }

  // Insert tiers
  for (const t of toolData.filter(d => d.tiers)) {
    for (let i = 0; i < t.tiers.length; i++) {
      const tier = t.tiers[i]
      const price = Math.max(0, Number(tier.monthly_price) || 0)
      const { error } = await c.from('tool_pricing_tiers').upsert({
        tool_id: t.tool.id,
        tier_name: String(tier.tier_name || 'Plan').substring(0, 50),
        monthly_price: price,
        features: String(tier.features || '').substring(0, 200),
        sort_order: i,
      }, { onConflict: 'tool_id,tier_name' })
      if (!error) totalInserted++
    }
  }

  console.log(`Batch ${Math.floor(batch / batchSize) + 1}/${Math.ceil(missing.length / batchSize)}: ${processed}/${missing.length} tools`)
  await new Promise(r => setTimeout(r, 2000))
}

const { count } = await c.from('tool_pricing_tiers').select('id', { count: 'exact', head: true })
console.log(`\nDone! Total tiers: ${count}, New: ${totalInserted}`)
