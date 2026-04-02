/** Rewrite Google favicon URLs to our caching proxy */
export function proxyFaviconUrl(url: string | null): string | null {
  if (!url) return null
  const match = url.match(/^https?:\/\/(?:www\.)?google\.com\/s2\/favicons\?domain=([^&]+)(?:&sz=(\d+))?/)
  if (!match) return url
  const domain = decodeURIComponent(match[1])
  const size = match[2] ?? '128'
  return `/api/favicon?d=${encodeURIComponent(domain)}&sz=${size}`
}
