export type BlogCluster = {
  slug: string
  label: string
  tags: string[]
}

export const BLOG_CLUSTERS: BlogCluster[] = [
  {
    slug: 'llm-comparison',
    label: 'LLM Comparison',
    tags: ['llm-comparison', 'chatgpt-vs-claude', 'gemini-ai', 'ai-tools', 'llm'],
  },
  {
    slug: 'ai-costs',
    label: 'AI Costs',
    tags: ['ai-spending-2026', 'cost-saving-ai', 'ai-spend', 'subscriptions', 'cost-tracking', 'ai-tools-audit'],
  },
  {
    slug: 'ai-agents',
    label: 'AI Agents',
    tags: ['ai-agents', 'automation', 'workflow-automation', 'business-automation'],
  },
  {
    slug: 'productivity',
    label: 'AI Productivity',
    tags: ['ai-productivity', 'productivity', 'business-productivity', 'ai-workflow'],
  },
  {
    slug: 'local-ai',
    label: 'Local AI',
    tags: ['local-ai', 'open-source', 'docker', 'self-hosted'],
  },
]

/** Find the best matching cluster for a set of post tags */
export function findCluster(postTags: string[]): BlogCluster | null {
  if (!postTags.length) return null
  let best: BlogCluster | null = null
  let bestCount = 0
  for (const cluster of BLOG_CLUSTERS) {
    const count = postTags.filter((t) => cluster.tags.includes(t)).length
    if (count > bestCount) {
      best = cluster
      bestCount = count
    }
  }
  return best
}
