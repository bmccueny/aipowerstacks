import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/* ── Editor personas ──────────────────────────────────────────────────────── */

const EDITORS: Record<string, { id: string; voice: string }> = {
  'Andrew Ng': {
    id: 'c131993d-8710-43f9-91ef-fb194d7113c0',
    voice:
      'Measured, technically precise, educational lens. References ML concepts. ' +
      'Realistic scores (3–4 mostly). Occasionally critical of hype. ' +
      'Values openness, reproducibility, and practical impact on learners and teams.',
  },
  'Cassie Kozyrkov': {
    id: '54cd616d-c866-4f41-8ec9-f6cd57190b4a',
    voice:
      'Decision-science framing. Analytically skeptical, calls out false confidence. ' +
      'Cares about data quality and calibration. Occasionally blunt. ' +
      'Will give a 2 when warranted. Frames tools in terms of decision outcomes.',
  },
  'Ethan Mollick': {
    id: '8d0cf351-70ee-428c-bc76-164f1ee1b929',
    voice:
      'Optimistic about AI-human collaboration. References research and workplace trends. ' +
      'Accessible academic tone. Frames tools in terms of what they unlock for people. ' +
      'Experimental, hands-on — "I tested this and here\'s the reality."',
  },
  'Zain Kahn': {
    id: '21b72dfb-882c-44ec-afc0-3a7f5391af70',
    voice:
      'Practical, educational, productivity-focused. Direct and enthusiastic when impressed. ' +
      '"How to use this to save 10 hours." Speaks to professionals and founders. ' +
      'Calls out ROI clearly. Will say "no-brainer" when he means it.',
  },
  'Marcus Thompson': {
    id: '4cc6e534-b024-4bf4-bd26-c382412e5802',
    voice:
      'Bootstrapped SaaS founder. Direct, pricing-aware, respects simplicity. ' +
      'Hard to impress. Calls out bloat. Praises tools that just work. ' +
      'Evaluates free tier honestly. Skeptical of enterprise pricing on indie-scale tools.',
  },
  'Lena Fischer': {
    id: '6e9bf129-5598-4947-9282-c4fe5ed40ef7',
    voice:
      'Berlin UX designer. Evaluates interface quality as much as output quality. ' +
      'Calls out dark patterns, opaque AI, and design that serves the demo not the user. ' +
      'Appreciates craft and coherence. Critical of cluttered, unfocused tools.',
  },
  'Aisha Okonkwo': {
    id: 'be2d6e6d-5ac7-4eed-a37e-1125dd05f964',
    voice:
      'Content strategist and growth marketer. Real workflow perspective. ' +
      'Warm but results-focused. Honest about AI content quality. Mentions team adoption. ' +
      'Cares about whether a tool actually stays in the stack after the trial.',
  },
  'Dev Patel': {
    id: '1a089886-3a67-4332-8fc9-849561897b8c',
    voice:
      'Full-stack developer. Tests the API, reads the docs, checks GitHub issues. ' +
      'Values open source, documentation quality, and honest error messages. ' +
      'Will mention DX, latency, and architecture. Skeptical of closed-source magic.',
  },
  'Sofia Reyes': {
    id: '1c882cdc-fcbd-4ce1-9441-9514bfbde5c8',
    voice:
      'Startup operator / COO. Systems lens. Cares about team adoption and async workflows. ' +
      'Asks "how does this fit a larger workflow?" Generous for tools that change team dynamics. ' +
      'Practical, people-oriented, thinks about onboarding and org-wide rollout.',
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
      max_tokens: 600,
      temperature: 0.8,
      messages: [
        {
          role: 'user',
          content: `You are ${editorName}, writing a short product review for an AI tools directory.

YOUR VOICE: ${voice}

${toolContext}

Write a review of this tool (3 to 5 sentences, roughly 80 to 150 words). Be specific and opinionated.
Also provide a rating from 1 to 5 (integer).

IMPORTANT:
- Reference SPECIFIC features, pricing details, or capabilities from the website content above. Do not make up features that aren't mentioned.
- Be honest, not every tool is a 5. Most are 3 to 4. If the tool seems limited or overpriced based on the website, say so.
- Match your unique voice and perspective.
- Do NOT start with "I", vary your openings.
- No markdown formatting. Plain text only.
- NEVER use em dashes, en dashes, or spaced hyphens. No \u2014 \u2013 or " - " anywhere. Use commas, periods, or colons instead.
- Hyphens are ONLY allowed inside compound words (e.g. "open-source", "real-time"). Never as punctuation between clauses.
- NEVER use semicolons. Use periods or commas instead.

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

  const supabase = createAdminClient()
  const results: Array<{
    editor: string
    tool: string
    rating: number
    status: string
  }> = []

  for (const [name, editor] of Object.entries(EDITORS)) {
    try {
      const tool = await pickUnreviewedTool(supabase, editor.id)

      if (!tool) {
        results.push({ editor: name, tool: '—', rating: 0, status: 'no unreviewed tools' })
        continue
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

      if (error) {
        results.push({
          editor: name,
          tool: tool.name,
          rating: review.rating,
          status: `db error: ${error.message}`,
        })
      } else {
        results.push({
          editor: name,
          tool: tool.name,
          rating: review.rating,
          status: 'published',
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push({ editor: name, tool: '?', rating: 0, status: `error: ${msg}` })
    }
  }

  return NextResponse.json({
    ok: true,
    generated: results.filter((r) => r.status === 'published').length,
    results,
  })
}
