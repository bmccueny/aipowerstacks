/**
 * Keyword Rankings Checker
 *
 * Checks if aipowerstacks.com appears in top 20 search results for target keywords.
 * Uses DuckDuckGo HTML search (no API key required).
 *
 * Usage: node scripts/check-rankings.mjs
 * Output: scripts/output/rankings-YYYY-MM-DD.json
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUTPUT_DIR = join(__dirname, 'output')

const TARGET_KEYWORDS = [
  'ai tools directory',
  'compare ai tools',
  'best ai tools 2026',
  'chatgpt alternatives',
  'ai tool tracker',
  'ai subscription tracker',
]

const TARGET_DOMAIN = 'aipowerstacks.com'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function searchDDG(keyword) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(keyword)}`

  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html',
    },
  })

  if (!resp.ok) {
    throw new Error(`DuckDuckGo returned ${resp.status}`)
  }

  const html = await resp.text()

  // Extract result URLs from DDG HTML results
  // DDG HTML version has links in <a class="result__url" href="...">
  const results = []
  const urlRegex = /class="result__url"[^>]*href="([^"]+)"/g
  let match
  while ((match = urlRegex.exec(html)) !== null) {
    results.push(decodeURIComponent(match[1]))
  }

  // Also try extracting from result__a links (main result links)
  const aRegex = /class="result__a"[^>]*href="([^"]+)"/g
  while ((match = aRegex.exec(html)) !== null) {
    const href = decodeURIComponent(match[1])
    // DDG sometimes wraps URLs in a redirect
    const uddgMatch = href.match(/uddg=([^&]+)/)
    if (uddgMatch) {
      results.push(decodeURIComponent(uddgMatch[1]))
    } else if (href.startsWith('http')) {
      results.push(href)
    }
  }

  // Deduplicate while preserving order
  const seen = new Set()
  const unique = []
  for (const r of results) {
    const normalized = r.replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (!seen.has(normalized)) {
      seen.add(normalized)
      unique.push(r)
    }
  }

  return unique.slice(0, 20)
}

async function checkKeyword(keyword) {
  try {
    const results = await searchDDG(keyword)

    let position = 'not found'
    let rankedUrl = null

    for (let i = 0; i < results.length; i++) {
      if (results[i].includes(TARGET_DOMAIN)) {
        position = i + 1
        rankedUrl = results[i]
        break
      }
    }

    return {
      keyword,
      position,
      url: rankedUrl,
      totalResults: results.length,
      date: new Date().toISOString().split('T')[0],
    }
  } catch (err) {
    return {
      keyword,
      position: 'error',
      url: null,
      error: err instanceof Error ? err.message : String(err),
      date: new Date().toISOString().split('T')[0],
    }
  }
}

async function main() {
  console.log(`Checking rankings for ${TARGET_KEYWORDS.length} keywords...\n`)

  const results = []

  for (const keyword of TARGET_KEYWORDS) {
    const result = await checkKeyword(keyword)
    results.push(result)

    const posDisplay = result.position === 'not found'
      ? '❌ not found'
      : result.position === 'error'
        ? `⚠️  error: ${result.error}`
        : `📍 #${result.position}`

    console.log(`  "${keyword}" → ${posDisplay}${result.url ? ` (${result.url})` : ''}`)

    // Be polite to DDG — wait between requests
    await sleep(2000)
  }

  // Save results
  mkdirSync(OUTPUT_DIR, { recursive: true })
  const dateStr = new Date().toISOString().split('T')[0]
  const outputPath = join(OUTPUT_DIR, `rankings-${dateStr}.json`)

  const output = {
    date: dateStr,
    domain: TARGET_DOMAIN,
    results,
    summary: {
      total: results.length,
      found: results.filter(r => typeof r.position === 'number').length,
      notFound: results.filter(r => r.position === 'not found').length,
      errors: results.filter(r => r.position === 'error').length,
    },
  }

  writeFileSync(outputPath, JSON.stringify(output, null, 2))
  console.log(`\n📁 Results saved to ${outputPath}`)

  // Compare with previous results if they exist
  try {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const prevPath = join(OUTPUT_DIR, `rankings-${yesterday}.json`)
    const prev = JSON.parse(readFileSync(prevPath, 'utf8'))

    console.log('\n📊 Changes from yesterday:')
    for (const curr of results) {
      const prevResult = prev.results.find(r => r.keyword === curr.keyword)
      if (!prevResult) continue

      const currPos = typeof curr.position === 'number' ? curr.position : null
      const prevPos = typeof prevResult.position === 'number' ? prevResult.position : null

      if (currPos && prevPos) {
        const diff = prevPos - currPos
        if (diff > 0) console.log(`  ⬆️  "${curr.keyword}": #${prevPos} → #${currPos} (+${diff})`)
        else if (diff < 0) console.log(`  ⬇️  "${curr.keyword}": #${prevPos} → #${currPos} (${diff})`)
        else console.log(`  ➡️  "${curr.keyword}": #${currPos} (unchanged)`)
      } else if (currPos && !prevPos) {
        console.log(`  🆕 "${curr.keyword}": now ranking at #${currPos}!`)
      } else if (!currPos && prevPos) {
        console.log(`  💨 "${curr.keyword}": dropped out (was #${prevPos})`)
      }
    }
  } catch {
    // No previous results to compare
  }
}

main().catch(err => {
  console.error('Rankings check failed:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
