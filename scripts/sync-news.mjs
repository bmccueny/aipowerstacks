#!/usr/bin/env node
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq < 1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    console.warn('[sync-news] .env.local not found, using existing env')
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const MAX_ITEMS_PER_FEED = 12
const ENRICH_BATCH_SIZE = 5
const ARTICLE_FETCH_TIMEOUT_MS = 8000

const DEFAULT_FEED_URLS = [
  'https://feeds.arstechnica.com/arstechnica/technology-lab',
  'https://the-decoder.com/feed/',
  'https://www.engadget.com/rss.xml',
  'https://feeds.feedburner.com/venturebeat/SZYF',
]

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('[sync-news] Missing SUPABASE_URL or SERVICE_ROLE_KEY')
  process.exit(1)
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function unwrapRssText(value) {
  if (!value) return null
  const noCdata = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
  if (!noCdata) return null
  return decodeHtmlEntities(noCdata)
}

function stripHtml(value) {
  if (!value) return null
  const cleaned = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned || null
}

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return unwrapRssText(match?.[1] ?? null)
}

function extractImageUrl(itemBlock, descriptionHtml) {
  const mediaUrl = itemBlock.match(/<(?:media:content|media:thumbnail|enclosure)\b[^>]*\burl=["']([^"']+)["'][^>]*\/?>/i)?.[1]
  if (mediaUrl) return decodeHtmlEntities(mediaUrl)
  const fromDescription = descriptionHtml?.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null
  if (fromDescription) return decodeHtmlEntities(fromDescription)
  return null
}

function toAbsoluteUrl(value, baseUrl) {
  if (!value) return null
  const cleaned = decodeHtmlEntities(value.trim())
  if (!cleaned || cleaned.startsWith('data:')) return null
  try { return new URL(cleaned, baseUrl).toString() } catch { return null }
}

function extractMetaImage(html, baseUrl) {
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
  const twitter = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
  return toAbsoluteUrl(og ?? twitter ?? null, baseUrl)
}

async function enrichItem(item) {
  if (item.image_url) return item
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ARTICLE_FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(item.url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'AIPowerStacks-News-Bot/1.0', Accept: 'text/html' },
    })
    const finalUrl = res.url || item.url
    if (!res.ok || !res.headers.get('content-type')?.includes('text/html')) return { ...item, url: finalUrl }
    const html = await res.text()
    return { ...item, url: finalUrl, image_url: extractMetaImage(html, finalUrl) ?? null }
  } catch {
    return item
  } finally {
    clearTimeout(timeout)
  }
}

async function enrichAll(items) {
  const out = []
  for (let i = 0; i < items.length; i += ENRICH_BATCH_SIZE) {
    const batch = items.slice(i, i + ENRICH_BATCH_SIZE)
    out.push(...await Promise.all(batch.map(enrichItem)))
  }
  return out
}

function extractChannelTitle(xml) {
  const channelBlock = xml.match(/<channel\b[^>]*>([\s\S]*?)<item/i)?.[1]
  if (!channelBlock) return null
  const titleMatch = channelBlock.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)
  return titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : null
}

function parseRssItems(xml, defaultSourceName, feedUrl) {
  return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]
    .map((match) => {
      const block = match[1]
      const title = extractTag(block, 'title')
      const link = extractTag(block, 'link')
      const guid = extractTag(block, 'guid') ?? link
      if (!title || !link || !guid) return null
      const descHtml = extractTag(block, 'description')
      const summary = stripHtml(descHtml)
      const imageUrl = extractImageUrl(block, descHtml)
      const pubDateRaw = extractTag(block, 'pubDate')
      const sourceMatch = block.match(/<source(?:\s+url="([^"]+)")?>([\s\S]*?)<\/source>/i)
      const parsedDate = pubDateRaw ? new Date(pubDateRaw) : new Date()
      const publishedAt = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString()
      return {
        guid,
        title,
        url: link,
        summary: summary && summary.length > 400 ? `${summary.slice(0, 397)}...` : summary,
        image_url: imageUrl,
        published_at: publishedAt,
        source_name: sourceMatch?.[2] ? unwrapRssText(sourceMatch[2]) : defaultSourceName,
        source_url: sourceMatch?.[1] ? decodeHtmlEntities(sourceMatch[1].trim()) : feedUrl,
      }
    })
    .filter(Boolean)
}

async function fetchFeed(feedUrl) {
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'AIPowerStacks-News-Bot/1.0', Accept: 'application/rss+xml, text/xml' },
    })
    if (!res.ok) { console.warn(`[sync-news] Feed failed (${res.status}): ${feedUrl}`); return [] }
    const xml = await res.text()
    const channelTitle = extractChannelTitle(xml) ?? feedUrl
    const items = parseRssItems(xml, channelTitle, feedUrl).slice(0, MAX_ITEMS_PER_FEED)
    console.log(`[sync-news] ${channelTitle}: ${items.length} items`)
    return items
  } catch (err) {
    console.warn(`[sync-news] Feed error: ${feedUrl} — ${err.message}`)
    return []
  }
}

async function upsertToSupabase(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_news?on_conflict=guid`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Supabase upsert failed (${res.status}): ${body}`)
  }
}

async function main() {
  const start = Date.now()
  console.log(`[sync-news] Starting at ${new Date().toISOString()}`)

  const envUrls = process.env.NEWS_RSS_URLS ?? process.env.NEWS_RSS_URL ?? ''
  const feedUrls = envUrls
    ? envUrls.split(',').map((u) => u.trim()).filter(Boolean)
    : DEFAULT_FEED_URLS

  const feedResults = await Promise.all(feedUrls.map(fetchFeed))

  const seen = new Set()
  const allItems = []
  for (const items of feedResults) {
    for (const item of items) {
      if (!seen.has(item.guid)) {
        seen.add(item.guid)
        allItems.push(item)
      }
    }
  }

  console.log(`[sync-news] ${allItems.length} unique items across ${feedUrls.length} feeds`)

  const enriched = await enrichAll(allItems)
  const withImages = enriched.filter((i) => i.image_url).length
  console.log(`[sync-news] ${withImages}/${enriched.length} items have images after enrichment`)

  const nowIso = new Date().toISOString()
  const rows = enriched.map((item) => ({ ...item, updated_at: nowIso }))

  await upsertToSupabase(rows)

  console.log(`[sync-news] Done — ${rows.length} upserted in ${Date.now() - start}ms`)
}

main().catch((err) => {
  console.error('[sync-news] Fatal:', err)
  process.exit(1)
})
