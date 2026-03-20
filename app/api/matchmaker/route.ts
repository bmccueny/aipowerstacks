import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getMatchedTools } from '@/lib/supabase/queries/tools'
import { getQueryEmbedding } from '@/lib/ai/embeddings'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  analyzeIntent,
  buildContextualStack,
  buildNarrative,
  buildWizardExplanation,
  type StackEntry,
} from '@/lib/matchmaker'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Claude: intelligent tool selection ────────────────────────────────────────
// Uses claude-haiku (lowest token cost) with the semantic pool as candidates.
// Falls back to heuristics if the API key is missing or the call fails.
async function selectStackWithClaude(message: string, pool: any[]): Promise<{
  intro: string
  stack: Array<{ id: string; role: string; reason: string }>
}> {
  // Trim tool data to absolute minimum to save input tokens
  const candidates = pool.slice(0, 20).map(t => ({
    id: t.id,
    name: t.name,
    tag: t.tagline || '',
    use: t.use_case || '',
    api: t.has_api ?? false,
    oss: t.is_open_source ?? false,
    price: t.pricing_model || '',
  }))

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 700,
    system: `You are an AI tool stack advisor. Given a user's project goal and candidate tools, select the 3-5 most relevant tools. For each, assign a specific role name (3-5 words) tailored to THIS project, and write one sentence explaining why it fits. Respond ONLY with valid JSON: {"intro":"<one sentence framing the stack>","stack":[{"id":"...","role":"...","reason":"..."}]}`,
    messages: [{
      role: 'user',
      content: `Goal: "${message}"\n\nCandidates:\n${JSON.stringify(candidates)}`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  // Extract JSON even if Claude wraps it in markdown fences
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in Claude response')
  return JSON.parse(match[0])
}

// ── POST: Chat / Natural Language Mode ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    if (!message?.trim()) return NextResponse.json({ tools: [], explanation: '' })

    const supabase = createAdminClient()

    // 1. Semantic pool — always runs, cheap local embeddings
    const embedding = await getQueryEmbedding(message)
    const vectorStr = `[${embedding.join(',')}]`

    const { data: pool, error: poolError } = await (supabase as any).rpc('match_tools_semantic', {
      query_embedding: vectorStr,
      match_threshold: 0.1,
      match_count: 30,
    })

    if (poolError) {
      console.error('Semantic search error:', poolError)
    }

    // If no semantic results, fall back to popular published tools
    let finalPool = pool
    if (!pool || pool.length === 0) {
      console.log('No semantic matches, falling back to popular tools')
      const { data: fallbackPool } = await supabase
        .from('tools')
        .select('id, name, slug, tagline, logo_url, pricing_model, is_verified, avg_rating, review_count, upvote_count, is_supertools, use_case, description, has_api, is_open_source, trains_on_data')
        .eq('status', 'published')
        .order('upvote_count', { ascending: false })
        .limit(30)
      finalPool = fallbackPool || []
    }

    // 2. Claude path — real AI reasoning over the semantic pool
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const { intro, stack: claudeStack } = await selectStackWithClaude(message, finalPool)
        const stack: StackEntry[] = claudeStack
          .map(({ id, role, reason }) => ({
            tool: finalPool.find((t: any) => t.id === id),
            role,
            description: reason,
          }))
          .filter((s): s is StackEntry => Boolean(s.tool))

        if (stack.length >= 2) {
          return NextResponse.json({
            tools: stack.map(s => s.tool),
            explanation: buildNarrative(stack, { intro }),
            roles: stack.map(s => ({ toolId: s.tool.id, role: s.role })),
          })
        }
      } catch (claudeErr: any) {
        // Log and fall through to heuristic fallback
        console.warn('Claude selection failed, using fallback:', claudeErr.message)
      }
    }

    // 3. Heuristic fallback — no API key or Claude failed
    const intent = analyzeIntent(message)
    const stack = buildContextualStack(finalPool, intent.roles)
    const results = stack.length >= 2 ? stack : finalPool.slice(0, 5).map((tool: any) => ({
      tool,
      role: 'Recommended',
      description: tool.tagline || '',
    }))

    return NextResponse.json({
      tools: results.map((s: any) => s.tool),
      explanation: buildNarrative(results, { message, primaryDomain: intent.primaryDomain }),
      roles: results.map((s: any) => ({ toolId: s.tool.id, role: s.role })),
    })
  } catch (err: any) {
    console.error('Matchmaker POST error:', err.message)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// ── GET: Guided Wizard Mode ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const useCase = searchParams.get('useCase') || 'content-creation'
  const pricing = (searchParams.get('pricing') as 'free' | 'paid' | 'any') || 'any'
  const persona = searchParams.get('persona') || ''
  const needsApi = searchParams.get('needsApi') === 'true'
  const needsMobile = searchParams.get('needsMobile') === 'true'
  const needsOpenSource = searchParams.get('needsOpenSource') === 'true'
  const needsPrivacy = searchParams.get('needsPrivacy') === 'true'
  const needsSSO = searchParams.get('needsSSO') === 'true'

  try {
    const tools = await getMatchedTools({
      useCase, pricing, persona,
      needsApi, needsMobile, needsOpenSource, needsPrivacy, needsSSO,
      limit: 5,
    })

    return NextResponse.json({
      tools,
      explanation: buildWizardExplanation(useCase, pricing, persona, tools.length),
    })
  } catch (err) {
    console.error('Matchmaker GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}
