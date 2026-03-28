#!/usr/bin/env node
/**
 * Backfill meta_description for published tools.
 *
 * NOTE: The `meta_description` column does NOT currently exist in the tools
 * table. This script generates descriptions from existing data and outputs
 * SQL UPDATE statements. If you add the column later, use --apply to write
 * directly via Supabase.
 *
 * Usage:
 *   node scripts/backfill-meta-descriptions.mjs          # dry-run (SQL output)
 *   node scripts/backfill-meta-descriptions.mjs --apply   # write to Supabase
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
const apply = process.argv.includes('--apply')

function truncate(text, max = 155) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:!?-]+$/, '')
}

function buildMetaDescription(tool) {
  const name = tool.name
  const pricing = tool.pricing_model || 'unknown'
  const category = tool.categories?.name || 'AI'
  const detail = tool.tagline || (tool.description || '').slice(0, 100)

  const raw = `${name} is a ${pricing} ${category} tool. ${detail}`
  return truncate(raw.replace(/\s+/g, ' ').trim())
}

async function main() {
  // Fetch all published tools (meta_description column may not exist yet)
  const { data: tools, error } = await supabase
    .from('tools')
    .select('id, slug, name, pricing_model, tagline, description, categories(name)')
    .eq('status', 'published')
    .order('name')

  if (error) {
    console.error('Query error:', error.message)
    process.exit(1)
  }

  console.log(`Found ${tools.length} published tools\n`)

  const updates = tools.map((tool) => ({
    id: tool.id,
    slug: tool.slug,
    meta_description: buildMetaDescription(tool),
  }))

  if (!apply) {
    console.log('-- DRY RUN: SQL statements (meta_description column must exist)\n')
    for (const u of updates) {
      const escaped = u.meta_description.replace(/'/g, "''")
      console.log(`UPDATE tools SET meta_description = '${escaped}' WHERE id = '${u.id}'; -- ${u.slug}`)
    }
    console.log(`\n-- ${updates.length} tools would be updated`)
    console.log('-- Run with --apply to write directly (requires meta_description column)')
    return
  }

  // Apply mode: attempt direct updates
  let success = 0
  let failed = 0
  for (const u of updates) {
    const { error: updateErr } = await supabase
      .from('tools')
      .update({ meta_description: u.meta_description })
      .eq('id', u.id)

    if (updateErr) {
      if (updateErr.message.includes('meta_description')) {
        console.error('ERROR: meta_description column does not exist. Add it first:')
        console.error('  ALTER TABLE tools ADD COLUMN meta_description TEXT;')
        process.exit(1)
      }
      console.error(`Failed ${u.slug}: ${updateErr.message}`)
      failed++
    } else {
      success++
    }
  }
  console.log(`Done: ${success} updated, ${failed} failed`)
}

main()
