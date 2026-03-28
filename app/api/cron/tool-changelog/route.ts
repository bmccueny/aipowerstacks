import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const JINA_BASE = 'https://r.jina.ai'
const XAI_BASE = 'https://api.x.ai/v1'

export const maxDuration = 300

// Known blog/changelog URLs for popular tools
const CHANGELOG_URLS: Record<string, string> = {
  'chatgpt': 'https://help.openai.com/en/articles/6825453-chatgpt-release-notes',
  'claude-code': 'https://docs.anthropic.com/en/docs/about-claude/models',
  'cursor-editor': 'https://changelog.cursor.com',
  'github-copilot': 'https://github.blog/changelog/label/copilot/',
  'midjourney-v7': 'https://docs.midjourney.com/changelog',
  'perplexity-ai': 'https://blog.perplexity.ai',
  'notion-ai': 'https://www.notion.com/releases',
  'windsurf': 'https://docs.windsurf.com/changelog',
  'replit': 'https://blog.replit.com',
  'elevenlabs-dubbing': 'https://elevenlabs.io/blog',
  'canva': 'https://www.canva.com/designwiki/whats-new/',
}

async function scrape(url: string): Promise<string | null> {
  try {
    const res = await fetch(`${JINA_BASE}/${url}`, {
      headers: { Accept: 'text/plain' },
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) return null
    return (await res.text()).slice(0, 6000)
  } catch {
    return null
  }
}

async function extractChanges(toolName: string, content: string): Promise<Array<{ event_type: string; title: string; summary: string }>> {
  const prompt = `Extract the 2-3 most recent/notable updates for "${toolName}" from this changelog/blog content. Only include updates from the last 30 days.

Return a JSON array of objects with:
- event_type: one of "feature", "model", "price", "integration", "free_tier"
- title: short title (max 60 chars)
- summary: one-sentence summary (max 120 chars)

If no recent updates found, return empty array [].
Only return the JSON array, nothing else.

Content:
${content.slice(0, 4000)}`

  try {
    const res = await fetch(`${XAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini-fast',
        max_tokens: 500,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) return []
    const data = await res.json()
    const text = (data.choices?.[0]?.message?.content ?? '').trim()
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return []
    return JSON.parse(match[0])
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.XAI_API_KEY) {
    return NextResponse.json({ error: 'XAI_API_KEY not set' }, { status: 500 })
  }

  const supabase = createAdminClient()

  // Get top tracked tools that have changelog URLs
  type TrackedRow = { tool_id: string; tools: { id: string; name: string; slug: string; website_url: string } }
  const { data: trackedRaw } = await supabase
    .from('user_subscriptions')
    .select('tool_id, tools!inner(id, name, slug, website_url)') as { data: TrackedRow[] | null }

  const toolCounts = new Map<string, { count: number; tool: { id: string; name: string; slug: string; website_url: string } }>()
  for (const row of trackedRaw ?? []) {
    const t = row.tools
    if (!t?.id) continue
    const existing = toolCounts.get(t.id)
    if (existing) existing.count++
    else toolCounts.set(t.id, { count: 1, tool: t })
  }

  const toolsToCheck = [...toolCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
    .map(e => e.tool)

  let inserted = 0
  const startTime = Date.now()

  for (const tool of toolsToCheck) {
    if (Date.now() - startTime > 240_000) break

    const changelogUrl = CHANGELOG_URLS[tool.slug] || (tool.website_url?.replace(/\/$/, '') + '/blog')
    const content = await scrape(changelogUrl)
    if (!content) continue

    const changes = await extractChanges(tool.name, content)

    for (const change of changes) {
      const { error } = await supabase
        .from('tool_changelog')
        .upsert({
          tool_id: tool.id,
          event_type: change.event_type,
          title: change.title,
          summary: change.summary,
          source_url: changelogUrl,
        }, { onConflict: 'tool_id,title' })

      if (!error) inserted++
    }

    await new Promise(r => setTimeout(r, 2000))
  }

  return NextResponse.json({ ok: true, toolsChecked: toolsToCheck.length, inserted })
}
