import type { Role } from './intent'

// ── Types ─────────────────────────────────────────────────────────────────────
export type StackEntry = { tool: any; role: string; description: string }

// ── Tool Scoring ───────────────────────────────────────────────────────────────
export function scoreToolForRole(tool: any, role: Role, poolRank: number): number {
  // Generic roles: score purely by semantic rank
  if (role.keywords.length === 0) return Math.max(0, 100 - poolRank * 10)

  const content = [tool.name, tool.tagline, tool.use_case, tool.description]
    .filter(Boolean).join(' ').toLowerCase()

  const matches = role.keywords.filter(k => content.includes(k)).length
  if (matches === 0) return 0 // Must match at least one keyword for specific roles

  let score = matches * 10
  if (tool.is_supertools) score += 15
  if (tool.is_verified) score += 8
  score += (tool.avg_rating || 0) * 2
  score -= poolRank * 1.5
  return score
}

export function buildContextualStack(pool: any[], roles: Role[]): StackEntry[] {
  const used = new Set<string>()
  const stack: StackEntry[] = []

  for (const role of roles) {
    let best: any = null
    let bestScore = 0

    pool.forEach((tool, rank) => {
      if (used.has(tool.id)) return
      const score = scoreToolForRole(tool, role, rank)
      if (score > bestScore) {
        bestScore = score
        best = tool
      }
    })

    if (best) {
      used.add(best.id)
      stack.push({ tool: best, role: role.label, description: role.description })
    }
  }

  // Fill remaining slots with top semantic matches if fewer than 3 were matched
  for (const tool of pool) {
    if (stack.length >= 5) break
    if (!used.has(tool.id)) {
      stack.push({ tool, role: 'Recommended', description: 'Highly relevant to your goal' })
      used.add(tool.id)
    }
  }

  return stack
}
