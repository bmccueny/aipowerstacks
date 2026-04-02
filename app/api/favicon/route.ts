import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_SIZES = new Set(['16', '32', '48', '64', '128'])

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get('d')
  const size = request.nextUrl.searchParams.get('sz') ?? '128'

  if (!domain || !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
    return NextResponse.json({ error: 'Invalid domain' }, { status: 400 })
  }
  if (!ALLOWED_SIZES.has(size)) {
    return NextResponse.json({ error: 'Invalid size' }, { status: 400 })
  }

  const upstreamUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`

  const upstream = await fetch(upstreamUrl, { next: { revalidate: 2592000 } })
  if (!upstream.ok) {
    return new NextResponse(null, { status: 502 })
  }

  const body = await upstream.arrayBuffer()
  const contentType = upstream.headers.get('content-type') ?? 'image/png'

  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400',
      'CDN-Cache-Control': 'public, max-age=2592000',
    },
  })
}
