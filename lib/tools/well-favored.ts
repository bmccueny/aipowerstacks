type ToolIdentity = {
  slug?: string | null
  name?: string | null
}

const WELL_FAVORED_SLUGS = new Set([
  'claude-code',
])

const WELL_FAVORED_NAMES = new Set([
  'claude code',
])

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function isWellFavoredTool(tool: ToolIdentity): boolean {
  const slug = tool.slug?.trim().toLowerCase()
  if (slug && WELL_FAVORED_SLUGS.has(slug)) return true

  const name = tool.name ? normalizeName(tool.name) : null
  if (name && WELL_FAVORED_NAMES.has(name)) return true

  return false
}
