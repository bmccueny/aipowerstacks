/**
 * Backfill 1,000 editor reviews across the last 2 months.
 *
 * Usage:
 *   npx tsx scripts/backfill-editor-reviews.ts              # dry run (shows plan)
 *   npx tsx scripts/backfill-editor-reviews.ts --apply       # actually insert reviews
 *   npx tsx scripts/backfill-editor-reviews.ts --apply --limit=50  # insert 50 reviews
 *
 * Requires: .env.local with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ── Editor personas (same as cron/editor-reviews) ────────────────────────────

const EDITORS: Record<string, { id: string; voice: string }> = {
  'Rina Takahashi': {
    id: 'c131993d-8710-43f9-91ef-fb194d7113c0',
    voice:
      'Writes reviews like Morgan Housel. Opens with a brief story or historical parallel. ' +
      'Short sentences that hit hard. Draws unexpected connections. Lets the reader draw conclusions ' +
      'rather than stating opinions directly. "Nobody expected that." Realistic scores, mostly 3-4.',
  },
  'Tomás Herrera': {
    id: '54cd616d-c866-4f41-8ec9-f6cd57190b4a',
    voice:
      'Writes reviews like Paul Graham. Simple, direct, conversational. Uses "you" a lot. ' +
      'Asks a rhetorical question then answers it. "The trick is..." "What most people dont realize..." ' +
      'No jargon. Short paragraphs. Will give a 2 when warranted.',
  },
  'Kofi Asante': {
    id: '8d0cf351-70ee-428c-bc76-164f1ee1b929',
    voice:
      'Writes reviews like Tim Urban. Self-deprecating, funny, uses parenthetical asides (like this). ' +
      'Makes the review feel like texting a friend. "Stay with me here" energy. Uses ALL CAPS for one word ' +
      'occasionally. Starts sentences with "And" and "But".',
  },
  'Mila Orozco': {
    id: '21b72dfb-882c-44ec-afc0-3a7f5391af70',
    voice:
      'Writes reviews like Lenny Rachitsky. Data-first. Mentions specific numbers, pricing, time saved. ' +
      '"Based on my testing..." Ends with a clear bottom line. Actionable and direct. ' +
      'Uses frameworks: "good for X, bad for Y."',
  },
  'Idris Mensah': {
    id: '4cc6e534-b024-4bf4-bd26-c382412e5802',
    voice:
      'Writes reviews like Ben Thompson. Connects the tool to a larger industry trend. ' +
      '"The key insight is..." Analytical, strategic. Evaluates pricing and positioning ' +
      'as much as features. Hard to impress. Skeptical of hype.',
  },
  'Suki Watanabe': {
    id: '6e9bf129-5598-4947-9282-c4fe5ed40ef7',
    voice:
      'Writes reviews like Kyla Scanlon. Gen Z energy, lowercase vibes. "honestly this tool is giving" ' +
      'and "the ux is mid tbh". Short fragments. On purpose. Coins phrases. References internet culture. ' +
      'Never boring even when critical.',
  },
  'Yara Dominguez': {
    id: 'be2d6e6d-5ac7-4eed-a37e-1125dd05f964',
    voice:
      'Writes reviews like Casey Newton. Journalist voice. States what the tool claims, then what ' +
      'actually happened. "According to their site..." then "In practice..." Balances company pitch ' +
      'with real experience. Numbered takeaways.',
  },
  'Niko Petrov': {
    id: '1a089886-3a67-4332-8fc9-849561897b8c',
    voice:
      'Writes reviews like Simon Willison. "I tested this" energy. Mentions specific versions, ' +
      'commands, configs. "Heres the interesting part:" Documents what worked and what didnt. ' +
      'Dry humor. Never hypes without testing.',
  },
  'Amara Chen': {
    id: '1c882cdc-fcbd-4ce1-9441-9514bfbde5c8',
    voice:
      'Writes reviews like Anne-Laure Le Cunff. Thoughtful, references research on productivity and ' +
      'team dynamics. "Research suggests..." Asks reflective questions. Evaluates how the tool fits ' +
      'into larger workflows. Gentle, never harsh. Uses "we" more than "you".',
  },
}

const editorEntries = Object.entries(EDITORS)

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomDate(daysBack: number): string {
  const now = Date.now()
  const offset = Math.random() * daysBack * 24 * 60 * 60 * 1000
  return new Date(now - offset).toISOString()
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function scrapeToolWebsite(url: string): Promise<string | null> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/plain' },
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) return null
    const text = await res.text()
    return text.slice(0, 3000)
  } catch {
    return null
  }
}

async function generateReview(
  editorName: string,
  voice: string,
  tool: { name: string; tagline: string | null; description: string | null; website_url: string | null },
  websiteContent: string | null,
): Promise<{ rating: number; body: string }> {
  const toolContext = [
    `Tool: ${tool.name}`,
    tool.tagline ? `Tagline: ${tool.tagline}` : null,
    tool.description ? `Description: ${tool.description}` : null,
    websiteContent
      ? `\nACTUAL WEBSITE CONTENT (use this for specific details, features, and pricing):\n${websiteContent}`
      : null,
  ]
    .filter((x): x is string => x != null)
    .join('\n')

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    temperature: 0.85,
    messages: [
      {
        role: 'user',
        content: `You are ${editorName}, writing a quick, punchy product review for an AI tools directory.

YOUR VOICE: ${voice}

${toolContext}

Write a review that is 2 to 3 sentences MAX (40 to 80 words). Be direct, specific, and opinionated. One clear take, not an essay.
Also provide a rating from 1 to 5 (integer).

CRITICAL RATING RULES:
- Your rating MUST follow this distribution. This is non-negotiable:
  * Rating 5: Extremely rare. Only for tools that are genuinely best-in-class with no real flaws.
  * Rating 4: Uncommon. Strong tool with one notable weakness.
  * Rating 3: The default. Most tools land here. Solid but has clear tradeoffs, limitations, or rough edges.
  * Rating 2: Below average. Real problems with pricing, UX, reliability, or overpromising.
  * Rating 1: Bad. Avoid.
- If you are unsure, default to 3. Seriously. A 3 is not an insult, it means "decent, with caveats."
- Think about what genuinely frustrates you about this tool. Every tool has something.

OTHER RULES:
- Reference SPECIFIC features or pricing from the website content above. Do not invent features.
- 2 to 3 sentences. That is it. Do not write more.
- No markdown formatting. Plain text only.
- NEVER use em dashes, en dashes, or spaced hyphens. No \u2014 \u2013 or " - " or "--" anywhere. Use commas or periods instead.
- Hyphens ONLY inside compound words (e.g. "open-source"). Never as punctuation.
- NEVER use semicolons.
- Write like a real person on Reddit, not a polished journalist. Include minor grammar imperfections: skip an apostrophe sometimes (dont, its, youre), use lowercase where formal writing wouldnt, start a sentence with "and" or "but", use casual phrases like "honestly", "tbh", "imo". The review should sound like someone typing quickly, not editing carefully.

Respond in EXACTLY this JSON format (no extra text):
{"rating": <number>, "body": "<review text>"}`,
      },
    ],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''

  try {
    const parsed = JSON.parse(text)
    const rating = Math.max(1, Math.min(5, Math.round(parsed.rating)))
    return { rating, body: parsed.body }
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      const rating = Math.max(1, Math.min(5, Math.round(parsed.rating)))
      return { rating, body: parsed.body }
    }
    throw new Error(`Failed to parse review JSON: ${text.slice(0, 200)}`)
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const apply = process.argv.includes('--apply')
  const limitArg = process.argv.find(a => a.startsWith('--limit='))
  const TARGET = limitArg ? parseInt(limitArg.split('=')[1], 10) : 1000
  const DAYS_BACK = 60
  const CONCURRENCY = 5 // parallel Claude calls

  console.log(`\n📝 Editor Review Backfill`)
  console.log(`   Target: ${TARGET} reviews`)
  console.log(`   Spread: last ${DAYS_BACK} days`)
  console.log(`   Mode: ${apply ? '🔴 APPLY (writing to DB)' : '🟡 DRY RUN'}`)
  console.log()

  // 1. Fetch all published tools
  const { data: allTools, error: toolsErr } = await supabase
    .from('tools')
    .select('id, name, tagline, description, website_url')
    .eq('status', 'published')

  if (toolsErr || !allTools?.length) {
    console.error('Failed to fetch tools:', toolsErr?.message)
    process.exit(1)
  }
  console.log(`   Found ${allTools.length} published tools`)

  // 2. Fetch existing editor reviews to avoid duplicates
  const editorIds = editorEntries.map(([, e]) => e.id)
  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('user_id, tool_id')
    .in('user_id', editorIds)

  const existingSet = new Set(
    (existingReviews ?? []).map(r => `${r.user_id}::${r.tool_id}`)
  )
  console.log(`   ${existingSet.size} existing editor reviews (will skip)`)

  // 3. Build assignment list: (editor, tool) pairs that don't exist yet
  const assignments: Array<{ editorName: string; editorId: string; voice: string; tool: typeof allTools[0] }> = []

  // Shuffle tools for random distribution
  const shuffledTools = [...allTools].sort(() => Math.random() - 0.5)

  let toolIdx = 0
  while (assignments.length < TARGET) {
    if (toolIdx >= shuffledTools.length) {
      // Reshuffle and cycle through editors differently
      shuffledTools.sort(() => Math.random() - 0.5)
      toolIdx = 0
    }

    const tool = shuffledTools[toolIdx++]
    const [editorName, editor] = pickRandom(editorEntries)
    const key = `${editor.id}::${tool.id}`

    if (existingSet.has(key)) continue
    existingSet.add(key) // prevent duplicates within this run

    assignments.push({ editorName, editorId: editor.id, voice: editor.voice, tool })
  }

  console.log(`   Planned ${assignments.length} new reviews\n`)

  if (!apply) {
    // Show distribution
    const byEditor: Record<string, number> = {}
    for (const a of assignments) {
      byEditor[a.editorName] = (byEditor[a.editorName] || 0) + 1
    }
    console.log('   Distribution by editor:')
    for (const [name, count] of Object.entries(byEditor).sort((a, b) => b[1] - a[1])) {
      console.log(`     ${name}: ${count}`)
    }
    console.log('\n   Run with --apply to write reviews to the database.')
    process.exit(0)
  }

  // 4. Generate and insert reviews in batches
  let generated = 0
  let failed = 0
  const ratingDist = [0, 0, 0, 0, 0]

  for (let i = 0; i < assignments.length; i += CONCURRENCY) {
    const batch = assignments.slice(i, i + CONCURRENCY)

    // Scrape websites for this batch (parallel)
    const websiteContents = await Promise.all(
      batch.map(a => a.tool.website_url ? scrapeToolWebsite(a.tool.website_url) : Promise.resolve(null))
    )

    // Generate reviews (parallel)
    const results = await Promise.allSettled(
      batch.map((a, idx) => generateReview(a.editorName, a.voice, a.tool, websiteContents[idx]))
    )

    // Insert successes
    for (let j = 0; j < results.length; j++) {
      const result = results[j]
      const assignment = batch[j]

      if (result.status === 'rejected') {
        failed++
        console.error(`   ✗ ${assignment.editorName} → ${assignment.tool.name}: ${result.reason}`)
        continue
      }

      const { rating, body } = result.value
      const createdAt = randomDate(DAYS_BACK)

      const { error: insertErr } = await supabase.from('reviews').insert({
        tool_id: assignment.tool.id,
        user_id: assignment.editorId,
        rating,
        body,
        title: null,
        status: 'published',
        is_verified: true,
        helpful_count: Math.floor(Math.random() * 12),
        created_at: createdAt,
        updated_at: createdAt,
      })

      if (insertErr) {
        failed++
        console.error(`   ✗ Insert failed for ${assignment.tool.name}: ${insertErr.message}`)
      } else {
        generated++
        ratingDist[rating - 1]++
        if (generated % 25 === 0 || generated === TARGET) {
          console.log(`   ✓ ${generated}/${TARGET} reviews generated (${failed} failed)`)
        }
      }
    }

    // Small delay between batches to avoid rate limits
    if (i + CONCURRENCY < assignments.length) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  // 5. Update avg_rating and review_count on affected tools
  console.log('\n   Updating tool ratings...')
  const affectedToolIds = [...new Set(assignments.map(a => a.tool.id))]

  for (let i = 0; i < affectedToolIds.length; i += 50) {
    const batch = affectedToolIds.slice(i, i + 50)
    for (const toolId of batch) {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('tool_id', toolId)
        .eq('status', 'published')

      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        await supabase
          .from('tools')
          .update({
            avg_rating: Math.round(avg * 100) / 100,
            review_count: reviews.length,
          })
          .eq('id', toolId)
      }
    }
  }

  console.log(`\n   Done!`)
  console.log(`   Generated: ${generated}`)
  console.log(`   Failed: ${failed}`)
  console.log(`   Rating distribution: ★1=${ratingDist[0]} ★2=${ratingDist[1]} ★3=${ratingDist[2]} ★4=${ratingDist[3]} ★5=${ratingDist[4]}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
