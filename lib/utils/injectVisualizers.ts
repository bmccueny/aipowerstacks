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

Create EXACTLY 2 visualizer blocks. Each must visualize COMPLETELY DIFFERENT data — no overlapping metrics.

BLOCK 1 — KEY NUMBERS: Extract 3 specific numbers or metrics mentioned in the article. Display as big bold stat cards in a row. These must be concrete data points FROM the text (hours, dollars, percentages, counts). Do NOT invent numbers.

BLOCK 2 — TOOL/CONCEPT BREAKDOWN: List the specific tools, products, or techniques mentioned in the article as a simple visual list or horizontal bar chart showing their relative usefulness/relevance. This block is about WHAT was discussed, not numbers. Example: showing "LTX 2.3 — video gen", "OpenCode — data analysis", "LiteParse — document parsing" as labeled bars or cards.

ABSOLUTE RULE: Block 1 shows NUMBERS. Block 2 shows NAMES/TOOLS. They must be completely different in nature — one is quantitative, one is qualitative. Never show the same information twice.

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
