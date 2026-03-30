/**
 * Pricing Staleness Report
 *
 * Finds tool_pricing_tiers where last_verified_at is null or older than 30 days.
 * Prioritizes by most-tracked tools (user_subscriptions count).
 *
 * Usage:
 *   node --env-file=.env.local scripts/pricing-staleness-report.mjs
 *   node --env-file=.env.local scripts/pricing-staleness-report.mjs --days=60
 */

import { createClient } from '@supabase/supabase-js'

const daysArg = process.argv.find(a => a.startsWith('--days='))
const STALE_DAYS = daysArg ? parseInt(daysArg.split('=')[1]) : 30

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const staleThreshold = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000).toISOString()

// Fetch stale pricing tiers with tool name and tracker count.
// We aggregate tier rows per tool so the report is tool-level, not tier-level.
const { data: tiers, error } = await supabase
  .from('tool_pricing_tiers')
  .select(`
    tool_id,
    last_verified_at,
    tools!inner ( id, name, slug )
  `)
  .or(`last_verified_at.is.null,last_verified_at.lt.${staleThreshold}`)
  .order('last_verified_at', { ascending: true, nullsFirst: true })

if (error) {
  console.error('Query failed:', error.message)
  process.exit(1)
}

if (!tiers || tiers.length === 0) {
  console.log(`No stale pricing tiers found (threshold: ${STALE_DAYS} days).`)
  process.exit(0)
}

// Deduplicate: one entry per tool_id, pick the oldest last_verified_at and count tiers
const toolMap = new Map()
for (const tier of tiers) {
  const existing = toolMap.get(tier.tool_id)
  if (!existing) {
    toolMap.set(tier.tool_id, {
      tool_id: tier.tool_id,
      name: tier.tools.name,
      slug: tier.tools.slug,
      oldest_verified_at: tier.last_verified_at,
      tier_count: 1,
    })
  } else {
    existing.tier_count++
    // Keep the oldest (null beats any date)
    if (existing.oldest_verified_at !== null && tier.last_verified_at === null) {
      existing.oldest_verified_at = null
    }
  }
}

// Fetch ALL tracker counts from user_subscriptions (small table, no need to filter)
const { data: subs, error: subsError } = await supabase
  .from('user_subscriptions')
  .select('tool_id')
  .limit(5000)

if (subsError) {
  console.error('Subscriptions query failed:', subsError.message)
  process.exit(1)
}

const trackerCount = {}
for (const sub of (subs || [])) {
  trackerCount[sub.tool_id] = (trackerCount[sub.tool_id] || 0) + 1
}

// Build final rows and sort by tracker count descending
const rows = [...toolMap.values()]
  .map(t => ({
    ...t,
    trackers: trackerCount[t.tool_id] || 0,
    days_since_verified: t.oldest_verified_at === null
      ? null
      : Math.floor((Date.now() - new Date(t.oldest_verified_at).getTime()) / (24 * 60 * 60 * 1000)),
  }))
  .sort((a, b) => b.trackers - a.trackers)

// Output report
const now = new Date().toISOString()
console.log(`\nPricing Staleness Report — ${now}`)
console.log(`Threshold: ${STALE_DAYS} days  |  Stale tools: ${rows.length}\n`)

const col = (s, w) => String(s ?? '').padEnd(w)

console.log(
  col('Tool', 36) +
  col('Tiers', 7) +
  col('Days stale', 12) +
  col('Trackers', 10)
)
console.log('-'.repeat(65))

for (const row of rows) {
  console.log(
    col(row.name.slice(0, 35), 36) +
    col(row.tier_count, 7) +
    col(row.days_since_verified ?? 'never', 12) +
    col(row.trackers, 10)
  )
}

console.log()
