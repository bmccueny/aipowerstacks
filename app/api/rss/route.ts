import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/constants/site'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('title, slug, excerpt, published_at, tags')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)

  const posts = (data ?? []) as { title: string; slug: string; excerpt: string; published_at: string | null; tags: string[] }[]
  const siteUrl = SITE_URL

  const items = posts.map((post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      ${post.published_at ? `<pubDate>${new Date(post.published_at).toUTCString()}</pubDate>` : ''}
      ${post.tags?.map((t) => `<category>${t}</category>`).join('') ?? ''}
    </item>`).join('')

  const lastBuildDate = posts.length > 0 && posts[0].published_at
    ? new Date(posts[0].published_at).toUTCString()
    : new Date().toUTCString()

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AIPowerStacks Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Daily AI news and briefings for builders: what changed, why it matters, and what to do next.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <image>
      <url>${siteUrl}/og-home-2026.jpg</url>
      <title>AIPowerStacks Blog</title>
      <link>${siteUrl}/blog</link>
      <width>144</width>
      <height>144</height>
    </image>
    <atom:link href="${siteUrl}/api/rss" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
