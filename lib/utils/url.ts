/**
 * Normalize a Thum.io screenshot URL:
 * - Ensure HTTPS
 * - Properly encode the captured article URL segment
 */
export function normalizeThumUrl(url: string | null): string | null {
  if (!url) return null

  // Ensure HTTPS
  let normalizedUrl = url.replace(/^http:\/\//, 'https://')

  // Handle Thum.io URLs
  if (normalizedUrl.startsWith('https://image.thum.io/get/')) {
    const marker = '/noanimate/'
    const markerIndex = normalizedUrl.indexOf(marker)
    if (markerIndex !== -1) {
      try {
        const parsed = new URL(normalizedUrl)
        const articlePartRaw = parsed.pathname.slice(markerIndex + marker.length).replace(/^\/+/, '')
        if (articlePartRaw) {
          // Decode once to handle any existing encoding
          const decoded = decodeURIComponent(articlePartRaw)
          // Re-encode properly
          const articleUrl = encodeURIComponent(decoded) + (parsed.search || '')
          normalizedUrl = `${normalizedUrl.slice(0, markerIndex + marker.length)}${articleUrl}`
        }
      } catch (error) {
        console.error('Error normalizing Thum.io URL:', error, url)
      }
    }
  }

  return normalizedUrl
}
