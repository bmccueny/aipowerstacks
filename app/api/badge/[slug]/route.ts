import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: tool } = await supabase
    .from('tools')
    .select('name, avg_rating, review_count')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!tool) {
    return new NextResponse('Not found', { status: 404 })
  }

  const name = tool.name
  const ratingText = tool.avg_rating > 0 ? `★ ${tool.avg_rating.toFixed(1)}` : 'Listed'

  // Measure text widths (approximate: 7px per char for the name, 6.5px for the right side)
  const leftWidth = Math.max(name.length * 7 + 16, 60)
  const rightWidth = Math.max(ratingText.length * 6.5 + 16, 50)
  const totalWidth = leftWidth + rightWidth

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${escapeXml(name)}: ${escapeXml(ratingText)}">
  <title>${escapeXml(name)}: ${escapeXml(ratingText)} on AIPowerStacks</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="20" fill="#555"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="20" fill="#e8457c"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="${leftWidth / 2}" y="14">${escapeXml(name)}</text>
    <text x="${leftWidth + rightWidth / 2}" y="14">${escapeXml(ratingText)}</text>
  </g>
</svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
