import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function untypedFrom(supabase: any, table: string) { return supabase.from(table) }

const anthropic = new Anthropic()

export const maxDuration = 30

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get user's subscriptions with full tool details
  const { data: rawSubs } = await untypedFrom(supabase, 'user_subscriptions')
    .select('tool_id, monthly_cost, tools:tool_id(name, slug, use_case, category_id, pricing_model, tagline, avg_rating, review_count, has_api, is_open_source)')
    .eq('user_id', user.id)

  type Sub = {
    tool_id: string
    monthly_cost: number
    tools: {
      name: string
      slug: string
      use_case: string | null
      category_id: string | null
      pricing_model: string
      tagline: string | null
      avg_rating: number
      review_count: number
      has_api: boolean
      is_open_source: boolean
    }
  }

  const subs = (rawSubs || []) as Sub[]
  if (subs.length < 2) return NextResponse.json({ analysis: null })

  // Get category names
  const catIds = [...new Set(subs.map(s => s.tools?.category_id).filter((id): id is string => id != null))]
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .in('id', catIds)

  const catMap = new Map<string, string>()
  for (const cat of categories || []) catMap.set(cat.id, cat.name)

  // Build the stack description for Claude
  const stackDescription = subs.map(s => {
    const t = s.tools
    const category = t.category_id ? catMap.get(t.category_id) || 'Unknown' : 'Unknown'
    return `- ${t.name} ($${Number(s.monthly_cost)}/mo) — ${t.tagline || 'No description'}. Category: ${category}. Use case: ${t.use_case || 'general'}. Rating: ${t.avg_rating > 0 ? `${t.avg_rating}/5 (${t.review_count} reviews)` : 'unrated'}. ${t.has_api ? 'Has API.' : ''} ${t.is_open_source ? 'Open source.' : ''}`
  }).join('\n')

  const totalMonthly = subs.reduce((s, sub) => s + Number(sub.monthly_cost), 0)
  const totalYearly = totalMonthly * 12

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `You are a direct, no-BS AI spending advisor. Analyze this person's AI tool stack and tell them honestly where they're wasting money and where they're not.

Their stack ($${totalMonthly}/mo, $${totalYearly}/yr):
${stackDescription}

Rules:
- Be specific about WHICH tools overlap and WHY. Don't just say "these are similar" — explain what both tools do that makes them redundant.
- If a premium tier tool ($100+/mo) overlaps with a cheaper one, explain what the expensive one gives them that the cheap one doesn't. Let them decide if that's worth it.
- If tools DON'T overlap, say so. Don't manufacture savings that aren't there.
- Consider that someone might need both a general chatbot (ChatGPT) AND a specialized tool (Cursor for coding) — that's not waste.
- Factor in ratings. A 4.8-star tool with 50 reviews is battle-tested. A 3.0-star tool is risky to rely on.
- Be concise. 3-4 short paragraphs max. No bullet points. Write like a smart friend giving advice, not a consultant writing a report.
- End with a single sentence verdict: keep everything, or what to cut.
- Never say "I recommend" or "I suggest" — just state it directly.`
    }],
  })

  const analysis = message.content[0].type === 'text' ? message.content[0].text : null

  return NextResponse.json({ analysis })
}
