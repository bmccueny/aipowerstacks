/**
 * Smart scraper: tries Firecrawl CLI first, falls back to Jina Reader
 * when Firecrawl credits are exhausted (402/insufficient credits error).
 *
 * Usage:
 *   import { scrapeUrl } from './lib/scrape.mjs'
 *   const markdown = await scrapeUrl('https://example.com')
 */

import { execFileSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'

const JINA_BASE = 'https://r.jina.ai'

// Track whether Firecrawl is available this run (don't retry after credit failure)
let firecrawlExhausted = false

/**
 * Scrape a URL, returning markdown content or null.
 * Tries Firecrawl CLI first, falls back to Jina on credit exhaustion.
 *
 * @param {string} url - URL to scrape
 * @param {object} [opts]
 * @param {number} [opts.maxChars=8000] - Max chars to return
 * @param {number} [opts.timeoutMs=15000] - Timeout in ms
 * @returns {Promise<string|null>}
 */
export async function scrapeUrl(url, { maxChars = 8000, timeoutMs = 15000 } = {}) {
  if (!url) return null

  // Try Firecrawl first (unless already exhausted this run)
  if (!firecrawlExhausted) {
    const result = tryFirecrawl(url, timeoutMs)
    if (result !== null) return result.slice(0, maxChars)
    // If tryFirecrawl returned null due to credits, firecrawlExhausted is now true
  }

  // Fall back to Jina Reader
  return jinaFallback(url, maxChars, timeoutMs)
}

/**
 * Try scraping with Firecrawl CLI.
 * Returns content string, or null if failed/credits exhausted.
 */
function tryFirecrawl(url, timeoutMs) {
  try {
    // Firecrawl scrape writes to .firecrawl/ directory
    const stdout = execFileSync('firecrawl', ['scrape', url, '--only-main-content'], {
      timeout: timeoutMs,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8',
    })

    // Check if output references a file path
    const fileMatch = stdout.match(/Saved to (.+\.md)/i)
    if (fileMatch && existsSync(fileMatch[1])) {
      return readFileSync(fileMatch[1], 'utf8')
    }

    // Some versions output markdown directly
    if (stdout.length > 100) return stdout

    return null
  } catch (err) {
    const msg = (err.stderr || err.message || '').toString().toLowerCase()
    if (msg.includes('insufficient credits') || msg.includes('402') || msg.includes('upgrade your plan')) {
      firecrawlExhausted = true
      console.log('  ⚡ Firecrawl credits exhausted — switching to Jina Reader for remaining URLs')
    }
    return null
  }
}

/**
 * Scrape via Jina Reader (free, no auth needed).
 */
async function jinaFallback(url, maxChars, timeoutMs) {
  try {
    const res = await fetch(`${JINA_BASE}/${url}`, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'markdown' },
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return null
    const text = await res.text()
    return text.slice(0, maxChars)
  } catch {
    return null
  }
}

/**
 * Reset the Firecrawl exhaustion flag (e.g. between batches if credits were added).
 */
export function resetFirecrawlStatus() {
  firecrawlExhausted = false
}

/**
 * Check if Firecrawl has been marked as exhausted this run.
 */
export function isFirecrawlExhausted() {
  return firecrawlExhausted
}
