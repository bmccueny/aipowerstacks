export type FreshnessLevel = 'fresh' | 'recent' | 'aging' | 'stale'

export function getFreshnessLevel(updatedAt: string | null): FreshnessLevel {
  if (!updatedAt) return 'stale'
  const days = (Date.now() - new Date(updatedAt).getTime()) / 86400000
  if (days <= 30) return 'fresh'
  if (days <= 60) return 'recent'
  if (days <= 90) return 'aging'
  return 'stale'
}
