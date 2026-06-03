/**
 * Generate 1000 authentic-sounding reviews for the top 150 tools.
 * Uses Gemini Flash (fast, cheap) with editor personas for voice variety.
 * Run: npx tsx scripts/generate-reviews.ts
 */

require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\n/g, '').trim()
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\\n/g, '').trim()
const GOOGLE_API_KEY = (process.env.GOOGLE_API_KEY || '').replace(/\\n/g, '').replace(/"/g, '').trim()

import { createClient } from '@supabase/supabase-js'
const admin = createClient(SUPABASE_URL, SUPABASE_KEY)

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta'

const EDITORS = [
  { id: 'c131993d-8710-43f9-91ef-fb194d7113c0', name: 'Rina Takahashi', style: 'thoughtful, references history, story-driven' },
  { id: '54cd616d-c866-4f41-8ec9-f6cd57190b4a', name: 'Tomás Herrera', style: 'conversational, data-driven, short paragraphs' },
  { id: '8d0cf351-70ee-428c-bc76-164f1ee1b929', name: 'Kofi Asante', style: 'funny, self-deprecating, uses ALL CAPS for emphasis' },
  { id: '21b72dfb-882c-44ec-afc0-3a7f5391af70', name: 'Mila Orozco', style: 'frameworks and tables, actionable, specific numbers' },
  { id: '4cc6e534-b024-4bf4-bd26-c382412e5802', name: 'Idris Mensah', style: 'strategic, connects to industry trends, analytical' },
  { id: '6e9bf129-5598-4947-9282-c4fe5ed40ef7', name: 'Suki Watanabe', style: 'gen-z energy, informal, uses "honestly" and "imo"' },
  { id: 'be2d6e6d-5ac7-4eed-a37e-1125dd05f964', name: 'Yara Dominguez', style: 'journalist, quotes and sources, balanced view' },
  { id: '1a089886-3a67-4332-8fc9-849561897b8c', name: 'Niko Petrov', style: 'developer, mentions versions and configs, practical' },
  { id: '1c882cdc-fcbd-4ce1-9441-9514bfbde5c8', name: 'Amara Chen', style: 'neuroscience-informed, gentle, uses "we" and "consider"' },
]

type Tool = { id: string; name: string; slug: string; tagline: string; pricing_model: string; use_case: string | null }

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(
    `${GEMINI_URL}/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 4000 },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

function randomDate(monthsBack: number): string {
  const now = Date.now()
  const past = now - Math.random() * monthsBack * 30 * 86400000
  return new Date(past).toISOString()
}

async function main() {
  // Get top 150 tools
  const { data: tools } = await admin
    .from('tools')
    .select('id, name, slug, tagline, pricing_model, use_case')
    .eq('status', 'published')
    .order('review_count', { ascending: false })
    .limit(150) as { data: Tool[] | null }

  if (!tools) { console.error('No tools found'); return }

  // Get existing reviews to avoid duplicates
  const { data: existingReviews } = await admin
    .from('reviews')
    .select('tool_id, user_id')
    .eq('status', 'published')

  const existingSet = new Set((existingReviews || []).map(r => `${r.tool_id}::${r.user_id}`))

  // Plan: ~7 reviews per tool across 150 tools = 1050 reviews
  // Each editor reviews ~17 tools (150 / 9)
  const reviewPlan: { tool: Tool; editor: typeof EDITORS[number] }[] = []

  for (const tool of tools) {
    // Each tool gets 5-9 reviews from random editors
    const reviewCount = 5 + Math.floor(Math.random() * 5)
    const shuffled = [...EDITORS].sort(() => Math.random() - 0.5)

    for (let i = 0; i < Math.min(reviewCount, shuffled.length); i++) {
      const key = `${tool.id}::${shuffled[i].id}`
      if (!existingSet.has(key)) {
        reviewPlan.push({ tool, editor: shuffled[i] })
        existingSet.add(key)
      }
    }
  }

  // Cap at 1000
  const plan = reviewPlan.slice(0, 1000)
  console.log(`[reviews] Generating ${plan.length} reviews for ${tools.length} tools`)

  // Process in batches of 8 reviews per Gemini call
  const BATCH = 8
  let total = 0
  let failed = 0

  for (let i = 0; i < plan.length; i += BATCH) {
    const batch = plan.slice(i, i + BATCH)
    const batchNum = Math.floor(i / BATCH) + 1
    const totalBatches = Math.ceil(plan.length / BATCH)

    console.log(`[reviews] Batch ${batchNum}/${totalBatches} (${total} done, ${failed} failed)...`)

    const prompt = `Write ${batch.length} authentic product reviews for AI tools. Each review should feel like a real person wrote it after using the tool for weeks.

TOOLS TO REVIEW:
${batch.map((b, idx) => `${idx + 1}. "${b.tool.name}" - ${b.tool.tagline} (${b.tool.pricing_model})
   Reviewer: ${b.editor.name} (style: ${b.editor.style})`).join('\n')}

RULES:
- Each review needs: rating (1-5, realistic distribution: mostly 3-5, occasional 2), title (under 80 chars), body (80-200 words)
- Ratings should be realistic: 30% give 5 stars, 35% give 4 stars, 20% give 3 stars, 10% give 2 stars, 5% give 1 star
- Body must feel personal: mention specific features used, time spent with tool, what worked/didn't
- Include at least one specific detail per review (a feature name, a use case, a time period)
- NEVER use dashes, semicolons, or the words: seamless, leverage, robust, nuanced, paradigm, delve, utilize
- Use contractions naturally (don't, can't, it's)
- Vary review length: some are 2 sentences, some are a full paragraph
- Some reviews should mention competitors by name
- Match each reviewer's writing style

Respond with ONLY a JSON array, no markdown fences:
[{"index": 0, "rating": 4, "title": "review title", "body": "review body"}, ...]`

    try {
      const response = await callGemini(prompt)
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.error(`  No JSON in response`)
        failed += batch.length
        continue
      }

      const reviews = JSON.parse(jsonMatch[0]) as Array<{ index: number; rating: number; title: string; body: string }>

      for (const review of reviews) {
        const item = batch[review.index]
        if (!item) continue

        const rating = Math.max(1, Math.min(5, review.rating))
        const createdAt = randomDate(8)

        const { error } = await admin.from('reviews').insert({
          tool_id: item.tool.id,
          user_id: item.editor.id,
          rating,
          title: (review.title || '').slice(0, 200),
          body: (review.body || '').slice(0, 2000),
          is_verified: true,
          helpful_count: Math.floor(Math.random() * 20),
          status: 'published',
          created_at: createdAt,
          updated_at: createdAt,
        })

        if (error) {
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            // Skip duplicates silently
          } else {
            console.error(`  Insert failed for ${item.tool.name}:`, error.message)
            failed++
          }
        } else {
          total++
        }
      }
    } catch (err) {
      console.error(`  Batch failed:`, err instanceof Error ? err.message : String(err))
      failed += batch.length

      if (String(err).includes('429')) {
        console.log('  Rate limited, waiting 30s...')
        await new Promise(r => setTimeout(r, 30000))
        i -= BATCH
      }
    }

    await new Promise(r => setTimeout(r, 500))
  }

  // Update avg_rating and review_count on all affected tools
  console.log(`\n[reviews] Updating tool ratings...`)
  const toolIds = [...new Set(plan.map(p => p.tool.id))]

  for (const toolId of toolIds) {
    const { data: toolReviews } = await admin
      .from('reviews')
      .select('rating')
      .eq('tool_id', toolId)
      .eq('status', 'published')

    if (toolReviews && toolReviews.length > 0) {
      const avg = toolReviews.reduce((s, r) => s + r.rating, 0) / toolReviews.length
      await admin.from('tools').update({
        avg_rating: Math.round(avg * 10) / 10,
        review_count: toolReviews.length,
      }).eq('id', toolId)
    }
  }

  console.log(`\n[reviews] Done. Inserted: ${total}, Failed: ${failed}`)
}

main()
