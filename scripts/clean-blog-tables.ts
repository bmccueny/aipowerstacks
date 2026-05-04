#!/usr/bin/env npx tsx
/**
 * Clean Forced Comparison Tables from Blog Posts
 *
 * Many blog posts were generated with irrelevant comparison tables shoved in.
 * This script:
 *   1. Fetches all published blog_posts that contain <table> HTML
 *   2. Keeps tables in posts whose title/tags explicitly indicate comparison content
 *      (vs, compare, best X, top N, pricing, alternatives, etc.)
 *   3. For remaining posts, applies a multi-signal heuristic to detect forced tables:
 *      - Generic 2x2 matrices ("High/Low" axes)
 *      - Tables mentioning unrelated tools (tool names not in title)
 *      - Tables with pricing columns in non-pricing articles
 *      - Tables with "AIPowerStacks" tracking data (internal data leak)
 *   4. Removes irrelevant <table>...</table> blocks and updates the DB
 *
 * Usage:
 *   npx tsx scripts/clean-blog-tables.ts              # Dry run
 *   npx tsx scripts/clean-blog-tables.ts --apply      # Actually update DB
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'

// ─── Load .env.local ────────────────────────────────────────────────────────
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
      let val = trimmed.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      val = val.replace(/\\n$/, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch { /* ok */ }
}
loadEnv()

// ─── Config ─────────────────────────────────────────────────────────────────
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\n/g, '').trim()
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\\n/g, '').trim()

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const args = process.argv.slice(2)
const APPLY = args.includes('--apply')

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Keywords in title/tags that signal a comparison table belongs.
 * Broadened to catch plurals, "top N", "costs", etc.
 */
const COMPARISON_KEYWORDS =
  /\b(vs\.?|versus|compar(e|es|ing|ison|isons)|best\s+\w+|top\s*\d+|pricing|costs?|prices?|alternative|alternatives|cheapest|free\s+vs|reviews?|benchmarks?|rated|ranked|rankings?|showdown|head[\s-]to[\s-]head|side[\s-]by[\s-]side|which\s+(is|should))\b/i

/** Extract all <table>...</table> blocks (handles nesting) */
function extractTables(html: string): { full: string; start: number; end: number }[] {
  const tables: { full: string; start: number; end: number }[] = []
  const regex = /<table[\s>]/gi
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    const startIdx = match.index
    let depth = 1
    let searchIdx = startIdx + match[0].length
    while (depth > 0 && searchIdx < html.length) {
      const openNext = html.indexOf('<table', searchIdx)
      const closeNext = html.indexOf('</table>', searchIdx)
      if (closeNext === -1) break
      if (openNext !== -1 && openNext < closeNext) {
        depth++
        searchIdx = openNext + 6
      } else {
        depth--
        if (depth === 0) {
          const endIdx = closeNext + '</table>'.length
          tables.push({
            full: html.slice(startIdx, endIdx),
            start: startIdx,
            end: endIdx,
          })
        }
        searchIdx = closeNext + '</table>'.length
      }
    }
  }
  return tables
}

/** Strip HTML tags and collapse whitespace */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Heuristic: determine if a table is forced/irrelevant for this article.
 *
 * Returns { forced: boolean; reason: string }
 *
 * Signals that indicate a FORCED table:
 *   1. Generic 2x2 matrix pattern ("High X / Low X" axes)
 *   2. Table contains "AIPowerStacks" or tracking data (internal leak)
 *   3. Table has pricing columns ($, /mo, /month, Free tier) in non-pricing articles
 *   4. Table compares well-known AI tools (ChatGPT, Copilot, Claude, etc.) in articles
 *      that are not about tool comparison
 *   5. Table headers include "Tool" + "Pricing" or "Tool" + "Key Benefit" (generic template)
 */
function isTableForced(
  title: string,
  tags: string[],
  tableHtml: string,
): { forced: boolean; reasons: string[] } {
  const text = stripHtml(tableHtml).toLowerCase()
  const titleLower = title.toLowerCase()
  const reasons: string[] = []

  // Signal 1: Generic 2x2 matrix ("High X / Low X" pattern)
  if (/high\s+\w+.*low\s+\w+/i.test(text) && /low\s+\w+.*high\s+\w+/i.test(text)) {
    reasons.push('Generic 2x2 matrix (High/Low axes)')
  }

  // Signal 2: Internal tracking data leak
  if (/aipowerstacks/i.test(text)) {
    reasons.push('Contains AIPowerStacks internal tracking data')
  }
  if (/tracked\s+users/i.test(text) || /tracking\s*\(/i.test(text)) {
    reasons.push('Contains user tracking metrics')
  }

  // Signal 3: Pricing columns in non-pricing articles
  const hasPricingData = /\$\d+\/mo/i.test(text) || /monthly\s+(cost|price|spend)/i.test(text) ||
    /free\s+tier/i.test(text) || /avg\.?\s+monthly\s+spend/i.test(text) ||
    /per\s+month/i.test(text)
  const isPricingArticle = /pric(e|ing|es)|cost|budget|spend|free\s+(ai|tool)/i.test(titleLower)
  if (hasPricingData && !isPricingArticle) {
    reasons.push('Pricing data in non-pricing article')
  }

  // Signal 4: Comparing well-known tools when article isn't about comparison
  const toolMentions = [
    'chatgpt', 'claude', 'copilot', 'gemini', 'grok', 'perplexity',
    'midjourney', 'dall-e', 'stable diffusion', 'synthesia', 'notion ai',
    'obsidian ai', 'cursor', 'bolt.new', 'replit', 'mem ai',
  ]
  const toolsInTable = toolMentions.filter((t) => text.includes(t))
  // Only flag if the table compares multiple tools AND the title isn't about those tools
  if (toolsInTable.length >= 2) {
    const toolsInTitle = toolMentions.filter((t) => titleLower.includes(t))
    if (toolsInTitle.length <= 1) {
      reasons.push(`Compares ${toolsInTable.length} unrelated tools: ${toolsInTable.join(', ')}`)
    }
  }

  // Signal 5: Generic template headers ("Tool" + "Key Benefit" + "Pricing")
  const headerPatterns = [
    /tool\s.*handling/i,
    /tool\s.*key\s+benefit/i,
    /tool\s.*pricing/i,
    /feature\s.*tool\s+based/i,
    /feature\s.*traditional/i,
    /tool\s.*setup\s+cost/i,
    /tool\s.*ease\s+of\s+use/i,
    /tool\s.*avg\.?\s+monthly/i,
    /tool\s.*tier/i,
    /aspect\s.*western/i, // geopolitical comparison forced into ethics articles
    /step\s+what\s+to\s+do/i, // instruction table that should be a list
  ]
  for (const pat of headerPatterns) {
    if (pat.test(text)) {
      reasons.push(`Generic template table header: ${pat.source}`)
      break
    }
  }

  // Signal 6: "Competing Tools" column (generated from internal DB)
  if (/competing\s+tools/i.test(text)) {
    reasons.push('Contains "Competing Tools" column (internal data)')
  }

  // Signal 7: Fabricated metrics (made-up percentages like "Retention Boost 20%", "Accuracy Gain 25%")
  const fabricatedMetrics = /\b(retention\s+boost|accuracy\s+gain|cost\s+savings|user\s+satisfaction|speed\s+increase|time\s+saved\s+per)\b/i
  if (fabricatedMetrics.test(text)) {
    reasons.push('Contains fabricated metrics columns')
  }

  // Signal 8: Generic framework tables ("Safe Approach / Risky Approach", "Practice / Approach")
  if (/\b(safe\s+approach|risky\s+approach|practice\s+.*approach)\b/i.test(text)) {
    reasons.push('Generic framework table (Safe/Risky approach)')
  }

  // Signal 9: 2x2 matrix with automation/strategic axes
  if (/\b(high\s+automation|low\s+automation|high\s+strategic|low\s+strategic|fragmented\s+tooling)\b/i.test(text)) {
    reasons.push('Generic 2x2 matrix (automation/strategic axes)')
  }

  // Signal 10: "Tool + Key Advantage" template pattern
  if (/tool\s.*key\s+advantage/i.test(text) || /tool\s.*real[\s-]world\s+example/i.test(text)) {
    reasons.push('Generic template table header: Tool + Key Advantage')
  }

  // Signal 11: Tables with mostly empty header cells (broken matrix tables)
  const thMatches = tableHtml.match(/<th[^>]*>[\s]*<\/th>/gi)
  const totalTh = tableHtml.match(/<th/gi)
  if (thMatches && totalTh && thMatches.length >= totalTh.length * 0.5) {
    reasons.push('Table has mostly empty header cells (broken matrix)')
  }

  // A table is forced if it triggers 1+ signals
  return { forced: reasons.length > 0, reasons }
}

/** Remove table blocks from content, cleaning up surrounding empty wrappers */
function removeTables(content: string, tables: { full: string }[]): string {
  let result = content
  for (const t of tables) {
    result = result.replace(t.full, '')
  }
  // Clean up empty <div> wrappers that may have only contained the table
  result = result.replace(/<div[^>]*>\s*<\/div>/gi, '')
  // Clean up headings that introduced the table (e.g., "## Quick Comparison" with nothing after)
  result = result.replace(/<h[2-4][^>]*>[^<]*(comparison|compare|at a glance|quick look|overview table|tool.*matrix)[^<]*<\/h[2-4]>\s*(?=<h[2-4]|$)/gi, '')
  // Clean up multiple consecutive blank lines
  result = result.replace(/\n{3,}/g, '\n\n')
  return result.trim()
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n=== Clean Forced Blog Tables ${APPLY ? '(APPLY MODE)' : '(DRY RUN)'} ===\n`)

  // 1. Fetch all published posts (paginated)
  console.log('Fetching published blog posts...')

  let allPosts: { id: string; title: string; content: string; tags: string[] }[] = []
  let from = 0
  const PAGE_SIZE = 500
  while (true) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, content, tags')
      .eq('status', 'published')
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      console.error('DB error:', error.message)
      process.exit(1)
    }
    if (!data || data.length === 0) break
    allPosts = allPosts.concat(data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  console.log(`Total published posts: ${allPosts.length}`)

  // 2. Filter to posts that contain <table
  const postsWithTables = allPosts.filter((p) => /<table[\s>]/i.test(p.content))
  console.log(`Posts containing tables: ${postsWithTables.length}`)

  if (postsWithTables.length === 0) {
    console.log('No tables found. Nothing to do.')
    return
  }

  // 3. Separate into "safe" (title/tags say comparison) vs "evaluate" (need heuristic check)
  const safeComparison: typeof postsWithTables = []
  const toEvaluate: typeof postsWithTables = []

  for (const post of postsWithTables) {
    const titleAndTags = `${post.title} ${(post.tags || []).join(' ')}`
    if (COMPARISON_KEYWORDS.test(titleAndTags)) {
      safeComparison.push(post)
    } else {
      toEvaluate.push(post)
    }
  }

  console.log(`Posts where table is expected (comparison keywords in title/tags): ${safeComparison.length}`)
  console.log(`Posts to evaluate with heuristics: ${toEvaluate.length}`)

  // 4. Also evaluate the "safe" group -- some have comparison keywords but still
  //    have forced tables (e.g., "Top AI Video Generation Tools" with an Obsidian/Notion table)
  const allToCheck = [...toEvaluate, ...safeComparison]

  let removedCount = 0
  let keptCount = 0
  let errorCount = 0
  const removedPosts: { title: string; reasons: string[] }[] = []

  for (let i = 0; i < allToCheck.length; i++) {
    const post = allToCheck[i]
    const tables = extractTables(post.content)
    if (tables.length === 0) {
      keptCount++
      continue
    }

    const progress = `[${i + 1}/${allToCheck.length}]`

    // Check each table in the post
    const tablesToRemove: { full: string }[] = []
    const allReasons: string[] = []

    for (const table of tables) {
      const result = isTableForced(post.title, post.tags || [], table.full)
      if (result.forced) {
        tablesToRemove.push(table)
        allReasons.push(...result.reasons)
      }
    }

    if (tablesToRemove.length === 0) {
      console.log(`${progress} KEEP   "${post.title}"`)
      keptCount++
      continue
    }

    const uniqueReasons = [...new Set(allReasons)]
    console.log(`${progress} REMOVE "${post.title}" (${tablesToRemove.length} table(s))`)
    console.log(`         Reasons: ${uniqueReasons.join('; ')}`)
    removedCount++
    removedPosts.push({ title: post.title, reasons: uniqueReasons })

    if (APPLY) {
      try {
        const cleaned = removeTables(post.content, tablesToRemove)
        const { error } = await supabase
          .from('blog_posts')
          .update({ content: cleaned })
          .eq('id', post.id)

        if (error) {
          console.error(`  DB update error for "${post.title}": ${error.message}`)
          errorCount++
        } else {
          const charDiff = post.content.length - cleaned.length
          console.log(`         Updated. Removed ${charDiff} characters.`)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`  Error updating "${post.title}": ${msg}`)
        errorCount++
      }
    }
  }

  // 5. Summary
  console.log('\n=== Summary ===')
  console.log(`Total published posts:           ${allPosts.length}`)
  console.log(`Posts with tables:               ${postsWithTables.length}`)
  console.log(`Tables kept (no forced signals): ${keptCount}`)
  console.log(`Tables removed (forced):         ${removedCount}`)
  console.log(`Errors:                          ${errorCount}`)

  if (removedPosts.length > 0) {
    console.log('\n--- Removed Table Details ---')
    for (const p of removedPosts) {
      console.log(`  "${p.title}"`)
      console.log(`    -> ${p.reasons.join('; ')}`)
    }
  }

  if (!APPLY && removedCount > 0) {
    console.log(`\nThis was a DRY RUN. Re-run with --apply to update the database.`)
  }
  if (APPLY && removedCount > 0) {
    console.log(`\nDone. ${removedCount} posts cleaned.`)
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
