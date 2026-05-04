import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/*
 * Edge Proxy — Bot Protection + Auth + Security Headers
 *
 * Layers (in order):
 *   1. Block known bad bots (403)
 *   2. Block AI crawlers from tool data (403)
 *   3. Block empty User-Agent (403)
 *   4. Rate limit unknown traffic (429)
 *   5. Supabase auth session refresh
 *   6. Auth route guards
 *   7. Security headers on response
 */

// ── Bot Lists ──

const BLOCKED_BOTS = [
  'AhrefsBot', 'SemrushBot', 'DotBot', 'MJ12bot', 'BLEXBot',
  'DataForSeoBot', 'serpstatbot', 'Bytespider', 'PetalBot',
  'YandexBot', 'MegaIndex', 'BomboraBot', 'Seekport',
  'thesis-research-bot', 'Amazonbot',
]

const AI_CRAWLERS = [
  'GPTBot', 'ChatGPT-User', 'Google-Extended', 'CCBot',
  'anthropic-ai', 'Claude-Web', 'Applebot-Extended',
  'Meta-ExternalFetcher', 'PerplexityBot',
  'Cohere-ai', 'Diffbot',
]

const ALLOWED_BOTS = [
  'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot',
  'facebookexternalhit', 'Twitterbot', 'LinkedInBot',
  'WhatsApp', 'TelegramBot', 'Discordbot',
  'Vercel', 'vercel-edge',
]

// ── Rate Limiting ──

const ipHits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 120
const RATE_WINDOW_MS = 60_000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = ipHits.get(ip)
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  entry.count++

  // Periodic cleanup to prevent memory leak
  if (ipHits.size > 10000) {
    for (const [key, val] of ipHits) {
      if (now > val.resetAt) ipHits.delete(key)
    }
  }

  return entry.count > RATE_LIMIT
}

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
}

function addSecurityHeaders(res: NextResponse) {
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
}

// ── Main Proxy ──

export async function proxy(request: NextRequest) {
  const ua = request.headers.get('user-agent') || ''
  const ip = getIp(request)
  const path = request.nextUrl.pathname

  // 1. Block known bad bots
  if (BLOCKED_BOTS.some(bot => ua.includes(bot))) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // 2. Block AI crawlers from scraping tool/API data
  if (AI_CRAWLERS.some(bot => ua.includes(bot)) && (path.startsWith('/tools/') || path.startsWith('/api/'))) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // 3. Block empty User-Agent (almost always a bot)
  if (!ua) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // 4. Rate limit non-allowlisted traffic
  const isGoodBot = ALLOWED_BOTS.some(bot => ua.includes(bot))
  if (!isGoodBot && isRateLimited(ip)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': '60' },
    })
  }

  // 5. Supabase auth session refresh
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    user = null
  }

  function redirectWithCookies(url: URL) {
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
    })
    addSecurityHeaders(redirectResponse)
    return redirectResponse
  }

  // 6. Auth route guards
  if (user && (path === '/login' || path === '/register')) {
    const url = request.nextUrl.clone()
    const redirectTo = request.nextUrl.searchParams.get('redirectTo')
    url.pathname = redirectTo || '/dashboard'
    url.search = ''
    return redirectWithCookies(url)
  }

  if (path.startsWith('/dashboard') || path.startsWith('/settings')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', path)
      return redirectWithCookies(url)
    }
  }

  if (path.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', path)
      return redirectWithCookies(url)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return redirectWithCookies(url)
    }
  }

  // 7. Security headers
  addSecurityHeaders(supabaseResponse)

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
