/**
 * Backfill embeddings for all published tools.
 *
 * Uses Xenova/all-MiniLM-L6-v2 (384-dim) to generate embeddings from
 * each tool's name + tagline + description, then writes them into
 * the `tools.embedding` column (vector(384)).
 *
 * Usage:
 *   node scripts/backfill-embeddings.mjs
 *   node scripts/backfill-embeddings.mjs --force   # re-embed even if already set
 */

import pkg from 'pg'
const { Client } = pkg
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { pipeline } from '@xenova/transformers'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── Load .env.local ──────────────────────────────────────────────────────────
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
  } catch {}
}
loadEnv()

const FORCE = process.argv.includes('--force')
const BATCH_SIZE = 50

// ── Setup ────────────────────────────────────────────────────────────────────
const DB_FALLBACK = 'postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres'
const connectionString = process.env.DATABASE_URL || DB_FALLBACK

async function main() {
  console.log('Loading embedding model (Xenova/all-MiniLM-L6-v2)...')
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('Connected to database.')

  // Fetch tools that need embeddings
  const whereClause = FORCE
    ? `WHERE status = 'published'`
    : `WHERE status = 'published' AND (embedding IS NULL)`

  const { rows: tools } = await client.query(
    `SELECT id, name, tagline, description FROM tools ${whereClause} ORDER BY published_at DESC`
  )

  console.log(`Found ${tools.length} tools to embed${FORCE ? ' (force mode)' : ''}.`)

  if (tools.length === 0) {
    console.log('Nothing to do.')
    await client.end()
    return
  }

  let updated = 0
  let errors = 0

  for (let i = 0; i < tools.length; i += BATCH_SIZE) {
    const batch = tools.slice(i, i + BATCH_SIZE)

    for (const tool of batch) {
      try {
        // Build the text to embed — same concatenation used in search_vector
        const text = [tool.name, tool.tagline, tool.description]
          .filter(Boolean)
          .join('. ')
          .slice(0, 2000) // Limit to avoid edge cases with very long descriptions

        if (!text.trim()) {
          console.warn(`  Skipping ${tool.id} (${tool.name}) — no text content`)
          continue
        }

        const output = await extractor(text, { pooling: 'mean', normalize: true })
        const embedding = Array.from(output.data)

        // pgvector expects the format [0.1, 0.2, ...]
        const vectorStr = `[${embedding.join(',')}]`

        await client.query(
          `UPDATE tools SET embedding = $1::vector WHERE id = $2`,
          [vectorStr, tool.id]
        )

        updated++
      } catch (err) {
        console.error(`  Error embedding ${tool.id} (${tool.name}):`, err.message)
        errors++
      }
    }

    const progress = Math.min(i + BATCH_SIZE, tools.length)
    console.log(`  Progress: ${progress}/${tools.length} (${updated} updated, ${errors} errors)`)
  }

  console.log(`\nDone! ${updated} tools embedded, ${errors} errors.`)
  await client.end()
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
