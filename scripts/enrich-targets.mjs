#!/usr/bin/env node
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import * as cheerio from 'cheerio'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Load Env
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
} catch { }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...opts.headers,
    },
  })
  if (res.status === 204) return null
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase error: ${err}`)
  }
  return res.json()
}

const TARGET_SLUGS = ['sora-2', 'devin-pro', 'midjourney-v7', 'perplexity-enterprise', 'gamma-app']

async function analyzeTarget(slug) {
  console.log(`Searching for slug: ${slug}...`)
  const tools = await fetchJson(`${SUPABASE_URL}/rest/v1/tools?slug=eq.${slug}&select=*`)
  if (!tools || tools.length === 0) {
    console.log(`Tool not found: ${slug}`)
    return
  }
  const t = tools[0]
  
  console.log(`Analyzing: ${t.name}...`)
  try {
    const res = await fetch(t.website_url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`)
    const html = await res.text()
    const $ = cheerio.load(html)
    const text = $('body').text().toLowerCase()
    
    const updates = {}
    
    // Description
    const metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content')
    if (metaDesc) updates.description = metaDesc.trim()
    
    // Logo
    const appleTouch = $('link[rel="apple-touch-icon"]').attr('href')
    const icon192 = $('link[rel="icon"][sizes="192x192"]').attr('href')
    const icon32 = $('link[rel="icon"][sizes="32x32"]').attr('href')
    const favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href')
    
    let bestLogo = appleTouch || icon192 || icon32 || favicon
    if (bestLogo) {
      updates.logo_url = bestLogo.startsWith('http') ? bestLogo : new URL(bestLogo, t.website_url).href
    }

    // Manual Overrides for 100% Accuracy
    if (slug === 'sora-2') {
      updates.logo_url = 'https://openai.com/favicon.ico'
      updates.pricing_model = 'paid'
    }
    if (slug === 'devin-pro') {
      updates.logo_url = 'https://www.cognition.ai/favicon.ico'
      updates.pricing_model = 'paid'
    }
    if (slug === 'perplexity-enterprise') {
      updates.logo_url = 'https://www.perplexity.ai/favicon.ico'
      updates.pricing_model = 'paid'
    }
    if (slug === 'midjourney-v7') {
      updates.logo_url = 'https://www.midjourney.com/favicon.ico'
      updates.pricing_model = 'paid'
    }
    if (slug === 'gamma-app') {
      updates.logo_url = 'https://gamma.app/favicon.ico'
      updates.pricing_model = 'freemium'
    }

    if (Object.keys(updates).length > 0) {
      await fetchJson(`${SUPABASE_URL}/rest/v1/tools?id=eq.${t.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })
      console.log(`✅ Updated ${t.name}: ${Object.keys(updates).join(', ')}`)
    }
  } catch (e) {
    console.error(`Failed ${t.name}:`, e.message)
  }
}

async function main() {
  for (const slug of TARGET_SLUGS) {
    await analyzeTarget(slug)
  }
  console.log('Targeted enrichment complete.')
}

main()
