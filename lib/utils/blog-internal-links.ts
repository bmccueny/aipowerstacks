import { createAdminClient } from '@/lib/supabase/admin'

interface ToolLink {
  name: string
  slug: string
}

let cachedTools: ToolLink[] | null = null

async function getToolNames(): Promise<ToolLink[]> {
  if (cachedTools) return cachedTools
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('tools')
    .select('name, slug')
    .eq('status', 'published')
    .order('name')
  cachedTools = data ?? []
  return cachedTools
}

/**
 * Replace first occurrence of each known tool name in HTML content
 * with an internal link to its tool page. Max 5 links per post.
 * Skips text already inside <a> or heading tags.
 */
export async function addInternalLinks(html: string): Promise<string> {
  const tools = await getToolNames()
  const linked = new Set<string>()

  // Sort by name length descending to match longer names first (e.g. "Claude Code" before "Claude")
  const sorted = [...tools].sort((a, b) => b.name.length - a.name.length)

  // Split HTML into tags and text chunks
  const parts = html.split(/(<[^>]+>)/)
  let insideLink = false
  let insideHeading = false

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    // Track whether we're inside an <a> or heading tag
    if (/<a[\s>]/i.test(part)) insideLink = true
    if (/<\/a>/i.test(part)) insideLink = false
    if (/<h[1-6][\s>]/i.test(part)) insideHeading = true
    if (/<\/h[1-6]>/i.test(part)) insideHeading = false

    // Skip HTML tags and content inside links/headings
    if (i % 2 === 1 || insideLink || insideHeading) continue
    if (linked.size >= 5) break

    for (const tool of sorted) {
      if (linked.size >= 5) break
      if (tool.name.length < 3) continue
      if (linked.has(tool.slug)) continue

      const escaped = tool.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = new RegExp(`\\b(${escaped})\\b`, 'i')

      if (pattern.test(parts[i])) {
        parts[i] = parts[i].replace(
          pattern,
          `<a href="/tools/${tool.slug}" class="text-primary hover:underline">$1</a>`,
        )
        linked.add(tool.slug)
      }
    }
  }

  return parts.join('')
}
