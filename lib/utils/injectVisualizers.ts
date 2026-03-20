const XAI_BASE_URL = 'https://api.x.ai/v1'

type Visualizer = { after: string; html: string }

/** Have Grok analyze article content and generate inline HTML visualizers (stat cards, bar charts, callouts) */
export async function injectVisualizers(content: string): Promise<string> {
  if (!process.env.XAI_API_KEY || content.length < 500) return content

  try {
    const res = await fetch(`${XAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.XAI_API_KEY}` },
      body: JSON.stringify({
        model: 'grok-3-mini',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [{ role: 'user', content: `You are a data visualization designer for blog posts. Given the article HTML below, create inline HTML visualizers.

ARTICLE:
${content}

Create EXACTLY 2 visualizer blocks to inject INTO the article between paragraphs. No more, no less.

Pick the 2 BEST types for this article (never use the same type twice):
- STAT CARDS ROW — 2-3 key numbers in bold cards side by side (e.g., "5 hrs/week saved", "$0 cost", "10x faster")
- COMPARISON BAR CHART — horizontal bars comparing things mentioned in the article
- CALLOUT BOX — ONE highlighted insight with accent left border (max 1 callout per article)
- PROGRESS/PERCENTAGE INDICATOR — visual bars for metrics

DESIGN (inline styles only):
- Container: background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 24px; margin: 32px 0
- Accent: #00E5FF (cyan) for bars/highlights, #FFD700 (gold) for secondary
- Stat numbers: font-size: 2.2em; font-weight: 900
- Bar tracks: background: rgba(0,0,0,0.1); border-radius: 8px; height: 12px; overflow: hidden
- Bar fills: border-radius: 8px; height: 100%
- Use display:flex, gap for layouts
- Text color: inherit (works in light/dark mode)
- Keep it clean, minimal, glass morphism feel

RETURN a JSON array:
[{"after": "<p>First 40 chars of paragraph to place after...", "html": "<div style=\\"...\\">...</div>"}]

Return ONLY the JSON array.` }],
      }),
    })

    if (!res.ok) return content

    const data = await res.json()
    const response = (data.choices?.[0]?.message?.content ?? '').trim()
    const jsonStr = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim()

    let visualizers: Visualizer[]
    try {
      visualizers = JSON.parse(jsonStr)
    } catch {
      return content
    }

    if (!Array.isArray(visualizers) || visualizers.length === 0) return content
    // Hard cap: never inject more than 2 visualizers
    visualizers = visualizers.slice(0, 2)

    let enhanced = content
    for (const v of visualizers) {
      const searchText = v.after.replace(/<[^>]+>/g, '').substring(0, 40)
      const idx = enhanced.indexOf(searchText)
      if (idx === -1) continue

      // Find the nearest closing tag after the match
      const closeTags = ['</p>', '</h2>', '</h3>', '</blockquote>', '</ul>', '</ol>']
      let tagEnd = -1
      for (const tag of closeTags) {
        const pos = enhanced.indexOf(tag, idx)
        if (pos !== -1 && (tagEnd === -1 || pos < tagEnd)) {
          tagEnd = pos + tag.length
        }
      }
      if (tagEnd === -1) continue

      enhanced = enhanced.substring(0, tagEnd) + '\n\n' + v.html + '\n\n' + enhanced.substring(tagEnd)
    }

    return enhanced
  } catch {
    return content
  }
}
