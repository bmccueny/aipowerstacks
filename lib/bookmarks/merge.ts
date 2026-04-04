const ANON_BOOKMARKS_KEY = 'aips_bookmarks_anon'

export function getAnonBookmarks(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ANON_BOOKMARKS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

export function setAnonBookmarks(ids: string[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ANON_BOOKMARKS_KEY, JSON.stringify(ids))
}

export function clearAnonBookmarks(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ANON_BOOKMARKS_KEY)
}

export async function mergeAnonBookmarks(): Promise<void> {
  const anon = getAnonBookmarks()
  if (anon.length === 0) return

  // POST each bookmark — API returns 400 for dupes, which is fine
  await Promise.allSettled(
    anon.map((toolId) =>
      fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId }),
      })
    )
  )

  clearAnonBookmarks()
}
