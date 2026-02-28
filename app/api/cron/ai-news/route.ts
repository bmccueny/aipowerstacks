import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DEFAULT_FEED_URLS = [
  'https://feeds.arstechnica.com/arstechnica/technology-lab',
  'https://the-decoder.com/feed/',
  'https://www.engadget.com/rss.xml',
  'https://feeds.feedburner.com/venturebeat/SZYF',
]
const MAX_ITEMS_PER_FEED = 12
const ENRICH_BATCH_SIZE = 5
const ARTICLE_FETCH_TIMEOUT_MS = 8000

type ParsedRssItem = {
  guid: string
  title: string
  url: string
  summary: string | null
  image_url: string | null
  published_at: string
  source_name: string | null
  source_url: string | null
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function unwrapRssText(value: string | null) {
  if (!value) return null
  const noCdata = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
  if (!noCdata) return null
  return decodeHtmlEntities(noCdata)
}

function stripHtml(value: string | null) {
  if (!value) return null
  const cleaned = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned || null
}

function extractTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return unwrapRssText(match?.[1] ?? null)
}

function extractImageUrl(itemBlock: string, descriptionHtml: string | null) {
  const mediaUrl = itemBlock.match(/<(?:media:content|media:thumbnail|enclosure)\b[^>]*\burl=["']([^"']+)["'][^>]*\/?>/i)?.[1]
  if (mediaUrl) return decodeHtmlEntities(mediaUrl)

  const fromDescription = descriptionHtml?.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null
  if (fromDescription) return decodeHtmlEntities(fromDescription)

  return null
}

function toAbsoluteUrl(value: string | null, baseUrl: string) {
  if (!value) return null
  const cleaned = decodeHtmlEntities(value.trim())
  if (!cleaned || cleaned.startsWith('data:')) return null

  try {
    return new URL(cleaned, baseUrl).toString()
  } catch {
    return null
  }
}

function getImageFromImgTag(tag: string, baseUrl: string) {
  const srcMatch = tag.match(/\b(?:src|data-src|data-original|data-lazy-src)=["']([^"']+)["']/i)
  const srcsetMatch = tag.match(/\bsrcset=["']([^"']+)["']/i)
  const srcsetFirst = srcsetMatch?.[1]?.split(',')[0]?.trim().split(' ')[0] ?? null
  const candidate = srcMatch?.[1] ?? srcsetFirst
  const absolute = toAbsoluteUrl(candidate, baseUrl)
  if (!absolute) return null
  if (/\.(svg|gif)(\?|$)/i.test(absolute)) return null
  if (/(icon|logo|avatar|sprite|gravatar|AI-News-White|Techforge|banner|cropped-AI-News-White)/i.test(absolute)) return null

  const width = Number(tag.match(/\bwidth=["'](\d+)["']/i)?.[1] ?? 0)
  const height = Number(tag.match(/\bheight=["'](\d+)["']/i)?.[1] ?? 0)
  if (width > 0 && height > 0) {
    if (width < 220 || height < 220) return null
    const ratio = width / height
    if (ratio > 2.2 || ratio < 0.5) return null
  }

  return absolute
}

function extractFirstArticleImage(html: string, baseUrl: string) {
  const articleBlock = html.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? null
  const candidates = [articleBlock, html].filter((block): block is string => Boolean(block))

  for (const block of candidates) {
    const imgTags = [...block.matchAll(/<img\b[^>]*>/gi)]
    for (const imgTag of imgTags) {
      const image = getImageFromImgTag(imgTag[0], baseUrl)
      if (image) return image
    }
  }

  return null
}

function extractMetaImage(html: string, baseUrl: string) {
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
  const twitter = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
  return toAbsoluteUrl(og ?? twitter ?? null, baseUrl)
}

async function enrichItemFromArticle(item: ParsedRssItem): Promise<ParsedRssItem> {
  if (item.image_url) return item

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ARTICLE_FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(item.url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'AIPowerStacks-News-Bot/1.0',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      },
    })

    const finalUrl = response.url || item.url
    const contentType = response.headers.get('content-type') ?? ''
    if (!response.ok || !contentType.includes('text/html')) {
      return { ...item, url: finalUrl }
    }

    const html = await response.text()
    const metaImage = extractMetaImage(html, finalUrl)
    const firstArticleImage = extractFirstArticleImage(html, finalUrl)

    return {
      ...item,
      url: finalUrl,
      image_url: metaImage ?? firstArticleImage ?? null,
    }
  } catch {
    return item
  } finally {
    clearTimeout(timeout)
  }
}

async function enrichItems(items: ParsedRssItem[]) {
  const enriched: ParsedRssItem[] = []
  for (let i = 0; i < items.length; i += ENRICH_BATCH_SIZE) {
    const batch = items.slice(i, i + ENRICH_BATCH_SIZE)
    const batchResults = await Promise.all(batch.map((item) => enrichItemFromArticle(item)))
    enriched.push(...batchResults)
  }
  return enriched
}

function extractChannelTitle(xml: string) {
  const channelMatch = xml.match(/<channel\b[^>]*>([\s\S]*?)<item/i)
  if (!channelMatch) return null
  const titleMatch = channelMatch[1].match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)
  return titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : null
}

function parseRssItems(xml: string, defaultSourceName: string, feedUrl: string) {
  const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]

  return items
    .map((match) => {
      const itemBlock = match[1]
      const title = extractTag(itemBlock, 'title')
      const link = extractTag(itemBlock, 'link')
      const guid = extractTag(itemBlock, 'guid') ?? link
      const descriptionHtml = extractTag(itemBlock, 'description')
      const summary = stripHtml(descriptionHtml)
      const imageUrl = extractImageUrl(itemBlock, descriptionHtml)
      const pubDateRaw = extractTag(itemBlock, 'pubDate')
      const sourceMatch = itemBlock.match(/<source(?:\s+url="([^"]+)")?>([\s\S]*?)<\/source>/i)
      const sourceUrl = sourceMatch?.[1] ? decodeHtmlEntities(sourceMatch[1].trim()) : feedUrl
      const sourceName = sourceMatch?.[2] ? unwrapRssText(sourceMatch[2]) : defaultSourceName

      if (!title || !link || !guid) return null

      const parsedDate = pubDateRaw ? new Date(pubDateRaw) : new Date()
      const publishedAt = Number.isNaN(parsedDate.getTime())
        ? new Date().toISOString()
        : parsedDate.toISOString()

      return {
        guid,
        title,
        url: link,
        summary: summary && summary.length > 400 ? `${summary.slice(0, 397)}...` : summary,
        image_url: imageUrl,
        published_at: publishedAt,
        source_name: sourceName,
        source_url: sourceUrl,
      }
    })
    .filter(Boolean) as ParsedRssItem[]
}

async function fetchFeed(feedUrl: string): Promise<ParsedRssItem[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'AIPowerStacks-News-Bot/1.0',
        Accept: 'application/rss+xml, application/xml, text/xml;q=0.9,*/*;q=0.8',
      },
      next: { revalidate: 0 },
    })

    if (!response.ok) return []

    const xml = await response.text()
    const channelTitle = extractChannelTitle(xml) ?? feedUrl
    return parseRssItems(xml, channelTitle, feedUrl).slice(0, MAX_ITEMS_PER_FEED)
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const envUrls = process.env.NEWS_RSS_URLS ?? process.env.NEWS_RSS_URL ?? ''
  const feedUrls = envUrls
    ? envUrls.split(',').map((u) => u.trim()).filter(Boolean)
    : DEFAULT_FEED_URLS

  const feedResults = await Promise.all(feedUrls.map(fetchFeed))

  const seen = new Set<string>()
  const allItems: ParsedRssItem[] = []
  for (const items of feedResults) {
    for (const item of items) {
      if (!seen.has(item.guid)) {
        seen.add(item.guid)
        allItems.push(item)
      }
    }
  }

  if (allItems.length === 0) {
    return NextResponse.json({ error: 'No items parsed from any feed' }, { status: 422 })
  }

  const enrichedItems = await enrichItems(allItems)

  const nowIso = new Date().toISOString()
  const rows = enrichedItems.map((item) => ({
    guid: item.guid,
    title: item.title,
    url: item.url,
    summary: item.summary ?? undefined,
    image_url: item.image_url ?? undefined,
    published_at: item.published_at,
    source_name: item.source_name ?? undefined,
    source_url: item.source_url ?? undefined,
    updated_at: nowIso,
  }))

  const admin = createAdminClient()
  const { error } = await admin
    .from('ai_news')
    .upsert(rows, { onConflict: 'guid', ignoreDuplicates: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    feeds: feedUrls.length,
    fetched: allItems.length,
    upserted: rows.length,
    ranAt: nowIso,
  })
}
