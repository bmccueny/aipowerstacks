/**
 * Enrich tools with platforms, privacy certifications, and free tier quality.
 * Run: npx tsx scripts/enrich-tool-metadata.ts
 */

require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\n/g, '').trim()
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\\n/g, '').trim()
const ANTHROPIC_KEY = (process.env.ANTHROPIC_API_KEY || '').replace(/\\n/g, '').trim()

import { createClient } from '@supabase/supabase-js'
const admin = createClient(SUPABASE_URL, SUPABASE_KEY)

type Tool = {
  id: string
  name: string
  slug: string
  tagline: string
  description: string | null
  pricing_model: string
  has_mobile_app: boolean
  has_api: boolean
  is_open_source: boolean
  has_sso: boolean
  trains_on_data: boolean
  website_url: string
}

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text || ''
}

async function main() {
  // Get tools missing metadata
  const { data: tools, error } = await admin
    .from('tools')
    .select('id, name, slug, tagline, description, pricing_model, has_mobile_app, has_api, is_open_source, has_sso, trains_on_data, website_url')
    .eq('status', 'published')
    .is('platforms', null)
    .limit(300)

  if (error || !tools) {
    console.error('Failed to fetch tools:', error?.message)
    return
  }

  console.log(`[enrich] Found ${tools.length} tools to enrich`)

  const BATCH_SIZE = 10
  let updated = 0

  for (let i = 0; i < tools.length; i += BATCH_SIZE) {
    const batch = tools.slice(i, i + BATCH_SIZE)
    console.log(`[enrich] Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tools.length / BATCH_SIZE)}...`)

    const prompt = `For each AI tool below, provide metadata in JSON array format. Base your answers on the tool name, description, and what you know about each tool.

Tools:
${batch.map((t, idx) => `${idx + 1}. ${t.name} (${t.slug}) - ${t.tagline}
   Pricing: ${t.pricing_model} | Mobile: ${t.has_mobile_app} | API: ${t.has_api} | SSO: ${t.has_sso}
   ${t.description?.slice(0, 150) || ''}`).join('\n\n')}

For each tool, return:
- platforms: array of supported platforms from: ["Web", "iOS", "Android", "macOS", "Windows", "Linux", "Chrome Extension", "VS Code", "JetBrains", "CLI", "API"]
- free_tier_quality: 1-5 rating of free tier generosity (1=very limited/no free, 2=barely usable free, 3=decent free tier, 4=generous free, 5=fully free/open source). If pricing is "free" give 5, if "paid" with no free tier give 1.
- gdpr_compliant: true/false/null (null if unknown)
- privacy_certs: array from: ["SOC 2", "GDPR", "HIPAA", "ISO 27001", "CCPA"] or empty array if unknown

Respond with ONLY a JSON array, no markdown:
[{"slug": "tool-slug", "platforms": [...], "free_tier_quality": N, "gdpr_compliant": true/false/null, "privacy_certs": [...]}, ...]`

    try {
      const response = await callClaude(prompt)
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.error(`  No JSON found in response`)
        continue
      }

      const results = JSON.parse(jsonMatch[0]) as Array<{
        slug: string
        platforms: string[]
        free_tier_quality: number
        gdpr_compliant: boolean | null
        privacy_certs: string[]
      }>

      for (const result of results) {
        const tool = batch.find(t => t.slug === result.slug)
        if (!tool) continue

        const { error: updateError } = await admin
          .from('tools')
          .update({
            platforms: result.platforms || [],
            free_tier_quality: Math.max(1, Math.min(5, result.free_tier_quality || 3)),
            gdpr_compliant: result.gdpr_compliant,
            privacy_certifications: result.privacy_certs || [],
          })
          .eq('id', tool.id)

        if (updateError) {
          console.error(`  Failed to update ${tool.name}:`, updateError.message)
        } else {
          updated++
        }
      }

      console.log(`  Updated ${results.length} tools`)
    } catch (err) {
      console.error(`  Batch failed:`, err instanceof Error ? err.message : String(err))
      // Rate limit backoff
      if (String(err).includes('429')) {
        console.log('  Rate limited, waiting 30s...')
        await new Promise(r => setTimeout(r, 30000))
        i -= BATCH_SIZE // retry this batch
      }
    }

    // Small delay between batches
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log(`\n[enrich] Done. Updated ${updated}/${tools.length} tools.`)
}

main()
