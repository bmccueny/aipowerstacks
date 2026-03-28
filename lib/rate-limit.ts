type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60_000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt + windowMs) {
      store.delete(key)
    }
  }
}

/**
 * Simple in-memory rate limiter using a sliding window.
 * Returns whether the request should be allowed and how many requests remain.
 */
export function rateLimit(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60_000,
): { success: boolean; remaining: number } {
  cleanup(windowMs)

  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || now > entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 }
  }

  entry.count += 1
  return { success: true, remaining: limit - entry.count }
}

/**
 * Extract client IP from request headers.
 * Falls back to 'unknown' if no IP header is present.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}
