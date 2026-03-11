/**
 * humanize-reviews.mjs
 *
 * Reads all published editor reviews from the database, rewrites them through
 * Claude Haiku to sound more naturally human while preserving each editor's
 * distinct voice, and generates titles for reviews that lack them.
 *
 * Usage:
 *   node scripts/humanize-reviews.mjs                        # Dry-run (preview only)
 *   node scripts/humanize-reviews.mjs --apply                # Write changes to DB
 *   node scripts/humanize-reviews.mjs --editor "Marcus Thompson"  # One editor only
 *   node scripts/humanize-reviews.mjs --apply --force        # Re-process all, even if already humanized
 *
 * Cost: ~$0.03 for ~87 reviews on Claude Haiku.
 */

import pkg from 'pg'
const { Client } = pkg
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const BACKUP_PATH = join(__dirname, '.review-backup.json')

// ── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  const p = join(ROOT, '.env.local')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 1) continue
    if (!process.env[t.slice(0, eq).trim()])
      process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim()
  }
}
loadEnv()

// ── CLI args ─────────────────────────────────────────────────────────────────
const APPLY = process.argv.includes('--apply')
const FORCE = process.argv.includes('--force')
const editorFlagIdx = process.argv.indexOf('--editor')
const EDITOR_FILTER = editorFlagIdx !== -1 ? process.argv[editorFlagIdx + 1] : null

if (!APPLY) {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  DRY RUN — no changes will be written to DB     ║')
  console.log('║  Pass --apply to write changes                  ║')
  console.log('╚══════════════════════════════════════════════════╝\n')
}

// ── Editor personality profiles ──────────────────────────────────────────────
const EDITOR_PROFILES = {
  '4cc6e534-b024-4bf4-bd26-c382412e5802': {
    name: 'Marcus Thompson',
    personality: `Bootstrapped SaaS founder who's built and sold two companies. Direct, pricing-aware, respects tools that just work. Calls out bloat and enterprise upsells. Writes like someone who tracks every dollar of SaaS spend. Uses casual but confident language. Occasionally mentions his own products or team as context.`,
  },
  '6e9bf129-5598-4947-9282-c4fe5ed40ef7': {
    name: 'Lena Fischer',
    personality: `European UX/design specialist based in Berlin. Precise, structured, values visual elegance and clean information architecture. Occasionally references the European tech ecosystem or design conferences. Slight formality in tone but not stiff — thinks carefully before writing. Appreciates craftsmanship in software.`,
  },
  'be2d6e6d-5ac7-4eed-a37e-1125dd05f964': {
    name: 'Aisha Okonkwo',
    personality: `Community builder and AI ethics advocate from Lagos. Warm but rigorous. Evaluates tools through the lens of accessibility, fairness, and real-world impact. References working with diverse teams and emerging markets. Genuinely excited about tools that democratize access. Critical of tools that ignore non-Western users.`,
  },
  '1a089886-3a67-4332-8fc9-849561897b8c': {
    name: 'Dev Patel',
    personality: `Full-stack developer and open-source contributor. Technical, opinionated, concise. Evaluates tools on actual engineering merit — performance, API quality, extensibility. Skeptical of marketing claims. References his own projects and PRs. Comfortable with profanity-adjacent frustration ("this drove me nuts"). Values documentation quality.`,
  },
  '1c882cdc-fcbd-4ce1-9441-9514bfbde5c8': {
    name: 'Sofia Reyes',
    personality: `Former journalist turned AI researcher based in Mexico City. Narrative-driven, contextual, thorough. Places tools in broader industry context. Writes with a storyteller's instinct — begins with a scene or situation. Bilingual thinker who occasionally uses Spanish-influenced phrasing. Values transparency in AI.`,
  },
  'c131993d-8710-43f9-91ef-fb194d7113c0': {
    name: 'Andrew Ng',
    personality: `Stanford professor and AI pioneer. Measured, academic, values educational potential and rigorous engineering. Recommends tools to students and research teams. Balanced and diplomatic even in criticism. References teaching, coursework, or research context. Uses precise technical language without jargon overload.`,
  },
  '54cd616d-c866-4f41-8ec9-f6cd57190b4a': {
    name: 'Cassie Kozyrkov',
    personality: `Chief Decision Scientist. Analytically skeptical, data-driven, witty. Tests claims against evidence. Appreciates tools that respect statistical rigor. Cuts through hype with dry humor. References A/B tests, decision frameworks, and "what does the data actually say?" Occasionally sarcastic about buzzwords.`,
  },
  '8d0cf351-70ee-428c-bc76-164f1ee1b929': {
    name: 'Ethan Mollick',
    personality: `Wharton professor studying AI's impact on work and creativity. Thoughtful, experimental, big-picture thinker. Tries tools hands-on and reports findings with academic curiosity. References his own experiments, classroom demos, and research. Academic but accessible and occasionally surprised by results.`,
  },
  '21b72dfb-882c-44ec-afc0-3a7f5391af70': {
    name: 'Zain Kahn',
    personality: `AI newsletter curator reaching 500K+ subscribers. Punchy, marketing-savvy, trend-aware. Evaluates tools on viral potential and practical value. Writes tight, scannable prose with strong opening hooks. References his newsletter audience and what resonates with them. Occasionally uses list-style thinking.`,
  },
  'db388dbe-ce6a-4bc3-876d-793e4ce37904': {
    name: 'Pete Huang',
    personality: `Co-founder of The Neuron newsletter. Breaks down AI trends with high-signal analysis and self-deprecating humor. Blends industry insight with approachable wit. References his newsletter audience and the firehose of AI tools he evaluates weekly. Comfortable being wrong and saying so. Conversational tone with occasional bad jokes.`,
  },
  '4789889d-7077-445c-a7fb-63bbee7e1a74': {
    name: 'Chris Bosley',
    personality: `Founder of The Rundown AI. Specializes in rapid-fire, high-impact AI news and tool discoveries. Writes with urgency and conviction, every tool either changes everything or isn't worth your time. Direct, opinionated, no hedging. References the sheer volume of tools he tests weekly. Newsletter-native voice, punchy paragraphs, strong verbs.`,
  },
  'af08a3d0-f4fa-42c1-b24f-7bf87b510105': {
    name: 'Jason Lee',
    personality: `Ex-Tesla Director of AI and OpenAI co-founder. Deep technical focus on LLM architecture and infrastructure. Evaluates tools on engineering merit, scalability, and whether they push the field forward. Precise and authoritative but not condescending. References building production ML systems. Occasionally compares tools to what big labs use internally.`,
  },
  'a6b778a3-1bf6-4530-8ac9-3ebb5dedf16e': {
    name: 'Brendan McCue',
    personality: `Creator of Datasette and co-creator of Django. Independent researcher obsessed with small tools, LLM transparency, and pragmatic open-source solutions. Skeptical of bloated platforms. Values tools that do one thing well. Writes like a developer's blog post, casual but technically sharp. References tinkering with tools in weekend projects.`,
  },
}

// ── Database ─────────────────────────────────────────────────────────────────
const DB = 'postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres'

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Check API key
  if (!process.env.XAI_API_KEY) {
    console.error('ERROR: XAI_API_KEY not found in environment or .env.local')
    console.error('Get a key at https://console.x.ai/')
    process.exit(1)
  }

  const XAI_BASE_URL = 'https://api.x.ai/v1'
  const XAI_MODEL = 'grok-3-mini-fast'

  async function callGrok(systemPrompt, userMessage) {
    const res = await fetch(`${XAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: XAI_MODEL,
        max_tokens: 400,
        temperature: 0.8,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`xAI API ${res.status}: ${errText}`)
    }

    const data = await res.json()
    return {
      text: data.choices?.[0]?.message?.content ?? '',
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
    }
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL || DB,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log('Connected to database.\n')

  // 2. Fetch all published, verified reviews with tool name
  let whereClause = `r.status = 'published' AND r.is_verified = true`
  const params = []

  if (EDITOR_FILTER) {
    // Look up editor UUID by name
    const editorEntry = Object.entries(EDITOR_PROFILES).find(
      ([, p]) => p.name.toLowerCase() === EDITOR_FILTER.toLowerCase()
    )
    if (!editorEntry) {
      console.error(`Editor "${EDITOR_FILTER}" not found. Available editors:`)
      Object.values(EDITOR_PROFILES).forEach(p => console.error(`  - ${p.name}`))
      await client.end()
      process.exit(1)
    }
    params.push(editorEntry[0])
    whereClause += ` AND r.user_id = $${params.length}`
  }

  // Skip already-humanized reviews (those with titles) unless --force
  if (!FORCE) {
    whereClause += ` AND r.title IS NULL`
  }

  const { rows: reviews } = await client.query(
    `SELECT r.id, r.user_id, r.rating, r.title, r.body, t.name as tool_name
     FROM reviews r
     JOIN tools t ON t.id = r.tool_id
     WHERE ${whereClause}
     ORDER BY r.created_at ASC`,
    params
  )

  console.log(`Found ${reviews.length} reviews to humanize${EDITOR_FILTER ? ` (editor: ${EDITOR_FILTER})` : ''}${!FORCE ? ' (skipping already-humanized)' : ''}.\n`)

  if (reviews.length === 0) {
    console.log('Nothing to do.')
    await client.end()
    return
  }

  // 3. Backup originals
  const backup = reviews.map(r => ({
    id: r.id,
    user_id: r.user_id,
    tool_name: r.tool_name,
    rating: r.rating,
    original_title: r.title,
    original_body: r.body,
  }))

  if (APPLY) {
    // Merge with existing backup if present
    let existingBackup = []
    if (existsSync(BACKUP_PATH)) {
      try {
        existingBackup = JSON.parse(readFileSync(BACKUP_PATH, 'utf8'))
      } catch {}
    }
    const existingIds = new Set(existingBackup.map(b => b.id))
    const merged = [...existingBackup, ...backup.filter(b => !existingIds.has(b.id))]
    writeFileSync(BACKUP_PATH, JSON.stringify(merged, null, 2))
    console.log(`Backup saved to ${BACKUP_PATH} (${merged.length} total reviews).\n`)
  }

  // 4. Process each review
  let processed = 0
  let errors = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0

  for (const review of reviews) {
    const profile = EDITOR_PROFILES[review.user_id]
    if (!profile) {
      console.warn(`  Skipping review ${review.id}, unknown editor UUID ${review.user_id}`)
      continue
    }

    const ratingWord = review.rating >= 4 ? 'positive' : review.rating >= 3 ? 'mixed' : 'negative'

    try {
      const systemPrompt = `You are ghostwriting as ${profile.name}, a tech reviewer.

Personality: ${profile.personality}

Rewrite the review below to sound more authentically human. Guidelines:
- Add a brief personal anecdote or context about how you discovered or started using this tool (1-2 sentences)
- Vary sentence lengths. Mix short punchy sentences with longer flowing ones
- Include one small hedge, self-correction, or brief tangential aside
- Use natural contractions (don't, it's, I've, wasn't)
- Maintain the SAME opinion, factual claims, and ${ratingWord} sentiment (this is a ${review.rating}/5 review)
- Stay under 200 words for the body
- Generate a short, natural-sounding review title (3-8 words, no quotation marks around it)

STRICT FORMATTING RULES (violating ANY of these will be rejected):
- NEVER use em dashes, en dashes, or spaced hyphens. No \u2014 \u2013 or " - " anywhere. Use commas or periods instead
- Hyphens are ONLY allowed inside compound words (e.g. "open-source", "real-time"). Never as punctuation between clauses
- NEVER use semicolons. Use periods or commas instead
- NEVER start sentences with "As a" or "As someone who"
- NEVER use these AI-tell phrases: "game-changer", "game changer", "dive into", "deep dive", "leverage", "harness", "delve", "landscape", "robust", "seamless", "cutting-edge", "elevate", "paradigm", "synergy", "it's worth noting", "I must say", "I have to say", "needless to say"
- Respond ONLY with valid JSON: {"title": "...", "body": "..."}
- Do NOT wrap the JSON in markdown fences or add any other text`

      const userMessage = `Tool: ${review.tool_name}\nRating: ${review.rating}/5\n\nOriginal review:\n${review.body}`

      const response = await callGrok(systemPrompt, userMessage)

      totalInputTokens += response.inputTokens
      totalOutputTokens += response.outputTokens

      const text = response.text.trim()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error(`  [${review.id}] No JSON in response for "${review.tool_name}" — skipping`)
        console.error(`  Raw response: ${text.slice(0, 200)}`)
        errors++
        continue
      }

      const { title, body } = JSON.parse(jsonMatch[0])
      if (!body || typeof body !== 'string') {
        console.error(`  [${review.id}] Invalid body in response for "${review.tool_name}" — skipping`)
        errors++
        continue
      }

      // Display diff
      const editorLabel = `${profile.name}`.padEnd(20)
      console.log(`─── ${editorLabel} reviewing "${review.tool_name}" (${review.rating}/5) ───`)

      if (title) {
        console.log(`  Title:  ${title}`)
      }

      console.log(`  Before: ${(review.body || '').slice(0, 120)}...`)
      console.log(`  After:  ${body.slice(0, 120)}...`)
      console.log()

      // Apply if not dry-run
      if (APPLY) {
        await client.query(
          `UPDATE reviews SET title = $1, body = $2, updated_at = now() WHERE id = $3`,
          [title || null, body, review.id]
        )
      }

      processed++

      // Rate limit: 100ms between calls
      await new Promise(r => setTimeout(r, 100))

    } catch (err) {
      console.error(`  [${review.id}] Error processing "${review.tool_name}" (${profile.name}):`, err.message)
      errors++

      // If it's an auth/billing error, abort early
      if (err.message?.includes('401') || err.message?.includes('403') || err.message?.includes('429') || err.message?.includes('authentication') || err.message?.includes('Unauthorized')) {
        console.error('\n  ABORTING: API error (auth/rate-limit). Check your XAI_API_KEY and try again.')
        break
      }
    }
  }

  // 5. Summary
  console.log('\n════════════════════════════════════════════════════')
  console.log(`  Reviews processed:  ${processed}`)
  console.log(`  Errors:             ${errors}`)
  console.log(`  Input tokens:       ${totalInputTokens.toLocaleString()}`)
  console.log(`  Output tokens:      ${totalOutputTokens.toLocaleString()}`)

  const costEstimate = (totalInputTokens * 0.25 + totalOutputTokens * 1.25) / 1_000_000
  console.log(`  Est. cost:          $${costEstimate.toFixed(4)}`)

  if (APPLY) {
    console.log(`\n  Changes APPLIED to database.`)
    console.log(`  Backup at: ${BACKUP_PATH}`)
  } else {
    console.log(`\n  DRY RUN — no changes written. Pass --apply to commit.`)
  }
  console.log('════════════════════════════════════════════════════')

  await client.end()
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
