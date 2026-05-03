import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/utils/anthropic'

export const maxDuration = 30

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get user's subscriptions
  const { data: rawSubs } = await supabase
    .from('user_subscriptions')
    .select('tool_id, monthly_cost')
    .eq('user_id', user.id)

  const subs = rawSubs as { tool_id: string; monthly_cost: number }[] | null

  if (!subs || subs.length < 2) {
    return NextResponse.json({ overlaps: [], message: 'Need at least 2 tools to detect overlap' })
  }

  // Fetch tool details separately
  const toolIds = subs.map(s => s.tool_id)
  const { data: rawTools } = await supabase
    .from('tools')
    .select('id, name, slug, tagline, use_case, pricing_model')
    .in('id', toolIds)

  const toolsMap = new Map((rawTools as { id: string; name: string; slug: string; tagline: string; use_case: string | null; pricing_model: string }[] ?? []).map(t => [t.id, t]))

  const toolContext = subs
    .filter(s => toolsMap.has(s.tool_id))
    .map(s => {
      const t = toolsMap.get(s.tool_id)!
      return {
        name: t.name,
        slug: t.slug,
        tagline: t.tagline,
        use_case: t.use_case,
        monthly_cost: s.monthly_cost,
      }
    })

  if (toolContext.length < 2) {
    return NextResponse.json({ overlaps: [], message: 'Not enough tool data' })
  }

  try {
    const result = await callClaude({
      messages: [{
        role: 'user',
        content: `Analyze these AI tool subscriptions for overlap. Two tools "overlap" if they can largely replace each other for the same job.

User's tools:
${JSON.stringify(toolContext, null, 2)}

Respond with JSON (no markdown fences):
{
  "overlaps": [
    {
      "tools": ["tool-slug-1", "tool-slug-2"],
      "reason": "Both do X. Keep Y because Z.",
      "potential_savings": <monthly dollars saved by dropping one>,
      "recommendation": "keep" | "switch" | "evaluate"
    }
  ],
  "total_potential_savings": <number>,
  "stack_efficiency_score": <1-10, where 10 = zero overlap>
}

Rules:
- Only flag real overlaps where features genuinely compete
- Don't flag complementary tools (e.g., coding IDE + deployment tool)
- Be specific about which to keep and why
- If no overlaps exist, return empty array with score 10`
      }],
      maxTokens: 600,
      temperature: 0.4,
      model: 'claude-haiku-4-5-20251001',
    })

    const jsonMatch = result.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ overlaps: [], message: 'Analysis failed' })
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch {
    return NextResponse.json({ overlaps: [], message: 'AI analysis unavailable' })
  }
}
