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
} catch {
  console.warn('.env.local not found')
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

// Fetch helper
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
  if (!res.ok) throw new Error(`Supabase error: ${res.statusText}`)
  return res.json()
}

// 1. Get Tools
async function getTools() {
  console.log('Fetching tools...')
  let allTools = []
  let offset = 0
  const limit = 100 // Process in batches
  
  while(true) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/tools`)
    url.searchParams.set('select', 'id,name,website_url,tagline,description,logo_url,pricing_model,has_api,has_mobile_app,is_open_source,pricing_type,has_sso,trains_on_data,model_provider,security_certifications')
    url.searchParams.set('status', 'in.(published,draft)')
    url.searchParams.set('order', 'created_at.desc')
    url.searchParams.set('limit', limit)
    url.searchParams.set('offset', offset)
    
    const tools = await fetchJson(url.toString())
    if (!tools || tools.length === 0) break
    allTools = allTools.concat(tools)
    offset += limit
    if (allTools.length >= 1000) break 
  }
  return allTools
}

// 2. Scrape & Analyze
async function analyzeWebsite(tool) {
  if (!tool.website_url) return null
  
  try {
    console.log(`Analyzing ${tool.name}...`)
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 10000) // 10s timeout
    
    const res = await fetch(tool.website_url, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIPowerStacksBot/1.0; +https://aipowerstacks.com)'
      }
    })
    clearTimeout(id)
    
    if (!res.ok) return null
    const html = await res.text()
    const $ = cheerio.load(html)
    const text = $('body').text().toLowerCase()
    const htmlLower = html.toLowerCase()

    const updates = {}

    // 1. Enhanced Deep Description Extraction
    let longDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || ''
    
    // Scrape body text for more detail if meta is brief
    const paragraphs = []
    $('p').each((i, el) => {
      const pText = $(el).text().trim()
      if (pText.length > 100 && pText.length < 600 && !pText.toLowerCase().includes('cookie') && !pText.toLowerCase().includes('privacy policy')) {
        paragraphs.push(pText)
      }
      if (paragraphs.length >= 3) return false // Get top 3 paragraphs
    })

    if (paragraphs.length > 0) {
      const combinedBodyText = paragraphs.join(' ')
      // Use body text if it's significantly longer than current meta or current description
      if (combinedBodyText.length > longDesc.length && combinedBodyText.length > (tool.description?.length || 0)) {
        longDesc = combinedBodyText
      }
    }

    if (longDesc && longDesc.length > (tool.description?.length || 0)) {
      updates.description = longDesc.trim().slice(0, 1500) // Cap at 1500 chars for readability
    }

    // 2. Logo Refinement (Use Google Favicon Service for Reliability)
    try {
      const domain = new URL(tool.website_url).hostname
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
      if (tool.logo_url !== faviconUrl) {
        updates.logo_url = faviconUrl
      }
    } catch (e) {
      // Fallback to old scraper logic if URL is invalid
      const appleTouch = $('link[rel="apple-touch-icon"]').attr('href')
      const icon192 = $('link[rel="icon"][sizes="192x192"]').attr('href')
      const favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href')
      const ogImage = $('meta[property="og:image"]').attr('content')
      
      let bestLogo = appleTouch || icon192 || favicon
      if (!bestLogo && ogImage && (ogImage.toLowerCase().includes('logo') || ogImage.toLowerCase().includes('icon'))) {
        bestLogo = ogImage
      }

      if (bestLogo) {
        const absoluteLogo = bestLogo.startsWith('http') ? bestLogo : new URL(bestLogo, tool.website_url).href
        if (absoluteLogo !== tool.logo_url) updates.logo_url = absoluteLogo
      }
    }

    // 3. Pricing Model Detection
    if (!tool.pricing_model || tool.pricing_model === 'unknown') {
      if (text.includes('free plan') || text.includes('free version') || (text.includes('free') && text.includes('pricing'))) {
        updates.pricing_model = 'freemium'
      } else if (text.includes('free trial')) {
        updates.pricing_model = 'freemium'
      } else if (text.includes('completely free') || text.includes('100% free') || text.includes('open source')) {
        if (!text.includes('pricing') && !text.includes('subscription')) updates.pricing_model = 'free'
        else updates.pricing_model = 'freemium'
      } else if (text.includes('pricing') || text.includes('subscription') || text.includes('buy now')) {
        updates.pricing_model = 'paid'
      }
    }

    // 4. API & Technical Signals
    if (!tool.has_api) {
      if (htmlLower.includes('api reference') || htmlLower.includes('documentation') || text.includes('rest api') || $('a[href*="/docs"]').length > 0) {
        updates.has_api = true
      }
    }

    if (!tool.has_sso) {
      if (text.includes('sso') || text.includes('saml') || text.includes('okta')) updates.has_sso = true
    }

    // 5. Security Certs
    const certs = tool.security_certifications || []
    if (text.includes('soc2') || text.includes('soc 2')) if (!certs.includes('SOC2')) certs.push('SOC2')
    if (text.includes('gdpr')) if (!certs.includes('GDPR')) certs.push('GDPR')
    if (text.includes('hipaa')) if (!certs.includes('HIPAA')) certs.push('HIPAA')
    
    if (certs.length > (tool.security_certifications?.length || 0)) {
      updates.security_certifications = certs
    }

    return Object.keys(updates).length > 0 ? updates : null

  } catch (err) {
    return null
  }
}

// 3. Main Loop
async function main() {
  const tools = await getTools()
  console.log(`Found ${tools.length} tools to analyze.`)
  
  let updated = 0
  const concurrency = 5
  
  for (let i = 0; i < tools.length; i += concurrency) {
    const batch = tools.slice(i, i + concurrency)
    const promises = batch.map(async (tool) => {
      const patches = await analyzeWebsite(tool)
      if (patches) {
        const url = `${SUPABASE_URL}/rest/v1/tools?id=eq.${tool.id}`
        await fetchJson(url, {
          method: 'PATCH',
          body: JSON.stringify(patches)
        })
        console.log(`✅ Updated ${tool.name}:`, patches)
        updated++
      }
    })
    await Promise.all(promises)
  }
  
  console.log(`Done! Updated ${updated} tools with deep metadata.`)
}

main()
