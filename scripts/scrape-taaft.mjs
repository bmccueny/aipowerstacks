import * as cheerio from 'cheerio'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pkg from 'pg'
const { Client } = pkg

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
  } catch (e) { }
}
loadEnv()

const connectionString = process.env.DATABASE_URL
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function getExistingDomains(client) {
  const res = await client.query("SELECT website_url FROM public.tools")
  return new Set(res.rows.map(r => {
    try {
      return new URL(r.website_url).hostname.replace('www.', '')
    } catch { return null }
  }).filter(Boolean))
}

async function scrapePage(pageNum) {
  const url = `https://theresanaiforthat.com/new/?page=${pageNum}`
  console.log(`Scraping ${url}...`)
  
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`Failed to fetch page ${pageNum}: ${res.statusText}`)
  
  const html = await res.text()
  const $ = cheerio.load(html)
  const tools = []

  $('.li').each((i, el) => {
    const name = $(el).find('.ai_name').text().trim()
    const tagline = $(el).find('.ai_description').text().trim() || $(el).find('.short_desc').text().trim()
    const internalLink = $(el).find('a.ai_link').attr('href')
    
    if (name && internalLink) {
        tools.push({
            name,
            tagline,
            internalLink: internalLink.startsWith('http') ? internalLink : `https://theresanaiforthat.com${internalLink}`
        })
    }
  })

  return tools
}

async function getRealUrl(internalUrl) {
    try {
        const res = await fetch(internalUrl, { headers: { 'User-Agent': USER_AGENT } })
        if (!res.ok) return null
        const html = await res.text()
        const $ = cheerio.load(html)
        
        let realUrl = $('.visit_website').attr('href') || $('a.visit_website').attr('href') || $('.open_ai').attr('href')
        
        if (!realUrl) {
            $('a').each((i, el) => {
                const href = $(el).attr('href')
                if (href && href.startsWith('http') && !href.includes('theresanaiforthat.com')) {
                    realUrl = href
                    return false
                }
            })
        }
        
        return realUrl || null
    } catch {
        return null
    }
}

async function main() {
  const client = new Client({ connectionString })
  await client.connect()
  
  const existingDomains = await getExistingDomains(client)
  const allNewTools = []
  
  // Scrape first 2 pages for a test
  for (let p = 1; p <= 2; p++) {
    const tools = await scrapePage(p)
    console.log(`Found ${tools.length} candidates on page ${p}`)
    
    for (const tool of tools) {
        const realUrl = await getRealUrl(tool.internalLink)
        if (!realUrl) {
            console.log(`  - No real URL for ${tool.name}`)
            continue
        }
        
        try {
            const urlObj = new URL(realUrl)
            const domain = urlObj.hostname.replace('www.', '')
            if (existingDomains.has(domain)) {
                // console.log(`  - Skipping existing: ${tool.name} (${domain})`)
                continue
            }
            
            const logo_url = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`
            const slug = tool.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

            allNewTools.push({
                ...tool,
                website_url: realUrl,
                logo_url,
                slug
            })
            console.log(`  + Found NEW tool: ${tool.name} -> ${realUrl}`)
            existingDomains.add(domain)
        } catch (e) {
            console.error(`Invalid URL for ${tool.name}: ${realUrl}`)
        }
    }
  }

  if (allNewTools.length > 0) {
    console.log(`Inserting ${allNewTools.length} new tools...`)
    for (const t of allNewTools) {
      try {
        await client.query(
          `INSERT INTO public.tools (name, website_url, tagline, logo_url, slug, status, category_id, description) 
           VALUES ($1, $2, $3, $4, $5, 'draft', '6d289a7f-ea6b-4e85-ad69-099f2bfb5439', $3)
           ON CONFLICT (website_url) DO NOTHING`,
          [t.name, t.website_url, t.tagline, t.logo_url, t.slug]
        )
      } catch (e) {
        console.error(`Failed to insert ${t.name}:`, e.message)
      }
    }
  } else {
    console.log('No new tools found.')
  }
  
  await client.end()
}

main().catch(console.error)
