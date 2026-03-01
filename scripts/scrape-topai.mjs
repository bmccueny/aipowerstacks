import * as cheerio from 'cheerio'
import { readFileSync } from 'fs'
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
  const url = `https://topai.tools/new?page=${pageNum}`
  console.log(`Scraping ${url}...`)
  
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`Failed to fetch page ${pageNum}: ${res.statusText}`)
  
  const html = await res.text()
  const $ = cheerio.load(html)
  const tools = []

  $('.card').each((i, el) => {
    const name = $(el).find('.card-title').text().trim() || $(el).find('h4').text().trim()
    const tagline = $(el).find('.card-text').text().trim()
    const website_url = $(el).find('a[href^="http"]').first().attr('href')
    
    if (name && website_url) {
        tools.push({
            name,
            tagline,
            website_url
        })
    }
  })

  return tools
}

async function main() {
  const client = new Client({ connectionString })
  await client.connect()
  
  const existingDomains = await getExistingDomains(client)
  const allNewTools = []
  
  for (let p = 1; p <= 3; p++) {
    const tools = await scrapePage(p)
    console.log(`Found ${tools.length} candidates on page ${p}`)
    
    for (const tool of tools) {
        try {
            const urlObj = new URL(tool.website_url)
            const domain = urlObj.hostname.replace('www.', '')
            if (existingDomains.has(domain) || domain.includes('topai.tools')) {
                continue
            }
            
            const logo_url = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`
            const slug = tool.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

            allNewTools.push({
                ...tool,
                logo_url,
                slug
            })
            console.log(`  + Found NEW tool: ${tool.name} -> ${tool.website_url}`)
            existingDomains.add(domain)
        } catch (e) {
            // console.error(`Invalid URL for ${tool.name}: ${tool.website_url}`)
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
        if (e.code !== '23505') console.error(`Failed to insert ${t.name}:`, e.message)
      }
    }
  } else {
    console.log('No new tools found.')
  }
  
  await client.end()
}

main().catch(console.error)
