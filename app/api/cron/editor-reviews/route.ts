import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/* ── Editor personas ──────────────────────────────────────────────────────── */

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

/* ── Helpers ───────────────────────────────────────────────────────────────── */

const XAI_BASE_URL = 'https://api.x.ai/v1'

interface ToolRow {
  id: string
  name: string
  tagline: string | null
  description: string | null
  website_url: string | null
}

/**
 * Pick one published tool that this editor has NOT yet reviewed.
 * Randomised via Supabase's random ordering to spread coverage.
 */
async function pickUnreviewedTool(
  supabase: ReturnType<typeof createAdminClient>,
  editorId: string,
): Promise<ToolRow | null> {
  // Get IDs this editor already reviewed
  const { data: reviewed } = await supabase
    .from('reviews')
    .select('tool_id')
    .eq('user_id', editorId)

  const reviewedIds = (reviewed ?? []).map((r) => r.tool_id)

  // Fetch published tools, excluding already-reviewed ones
  let query = supabase
    .from('tools')
    .select('id, name, tagline, description, website_url')
    .eq('status', 'published')
    .limit(100)

  if (reviewedIds.length > 0) {
    // Supabase PostgREST supports not.in filter
    query = query.not('id', 'in', `(${reviewedIds.join(',')})`)
  }

  const { data: tools, error } = await query

  if (error || !tools?.length) return null

  // Pick random from candidates
  return tools[Math.floor(Math.random() * tools.length)]
}

/**
 * Scrape a tool's website via Jina Reader for real product context.
 * Returns the scraped text (truncated to ~4000 chars) or null on failure.
 */
async function scrapeToolWebsite(url: string): Promise<string | null> {
  try {
    const jinaUrl = `https://r.jina.ai/${url}`
    const res = await fetch(jinaUrl, {
      headers: { Accept: 'text/plain' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    const text = await res.text()
    // Truncate to keep prompt size reasonable
    return text.slice(0, 4000)
  } catch {
    return null
  }
}

/**
 * Generate a review using Grok in the editor's voice,
 * enriched with real website content.
 */
async function generateReview(
  editorName: string,
  voice: string,
  tool: ToolRow,
): Promise<{ rating: number; body: string }> {
  // Scrape the tool's website for real product details
  const websiteContent = tool.website_url
    ? await scrapeToolWebsite(tool.website_url)
    : null

  const toolContext = [
    `Tool: ${tool.name}`,
    tool.tagline ? `Tagline: ${tool.tagline}` : null,
    tool.description ? `Description: ${tool.description}` : null,
    tool.website_url ? `Website: ${tool.website_url}` : null,
    websiteContent
      ? `\nACTUAL WEBSITE CONTENT (use this for specific details, features, and pricing):\n${websiteContent}`
      : null,
  ]
    .filter(Boolean)
    .join('\n')

  const res = await fetch(`${XAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-3-mini-fast',
      max_tokens: 300,
      temperature: 0.8,
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
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`${res.status} ${errText}`)
  }

  const data = await res.json()
  const text = (data.choices?.[0]?.message?.content ?? '').trim()

  try {
    const parsed = JSON.parse(text)
    const rating = Math.max(1, Math.min(5, Math.round(parsed.rating)))
    return { rating, body: parsed.body }
  } catch {
    // Fallback: try to extract JSON from the response
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      const rating = Math.max(1, Math.min(5, Math.round(parsed.rating)))
      return { rating, body: parsed.body }
    }
    throw new Error(`Failed to parse review JSON: ${text.slice(0, 200)}`)
  }
}

/* ── Route handler ─────────────────────────────────────────────────────────── */

export async function GET(request: Request) {
  // Auth check
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.XAI_API_KEY) {
    return NextResponse.json({ error: 'XAI_API_KEY not set' }, { status: 500 })
  }

  const supabase = createAdminClient()

  // Pick ONE random editor per invocation to stay within Vercel timeout
  const editorEntries = Object.entries(EDITORS)
  const [name, editor] = editorEntries[Math.floor(Math.random() * editorEntries.length)]

  try {
    const tool = await pickUnreviewedTool(supabase, editor.id)

    if (!tool) {
      return NextResponse.json({
        ok: true,
        generated: 0,
        result: { editor: name, tool: '—', rating: 0, status: 'no unreviewed tools' },
      })
    }

    const review = await generateReview(name, editor.voice, tool)

    const { error } = await supabase.from('reviews').insert({
      tool_id: tool.id,
      user_id: editor.id,
      rating: review.rating,
      body: review.body,
      status: 'published',
      is_verified: true,
    })

    return NextResponse.json({
      ok: true,
      generated: error ? 0 : 1,
      result: {
        editor: name,
        tool: tool.name,
        rating: review.rating,
        status: error ? `db error: ${error.message}` : 'published',
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({
      ok: false,
      generated: 0,
      result: { editor: name, tool: '?', rating: 0, status: `error: ${msg}` },
    }, { status: 500 })
  }
}
