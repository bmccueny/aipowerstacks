#!/usr/bin/env node
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

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
  } catch {
    console.warn('[compare-backfill] .env.local not found, using existing env')
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('[compare-backfill] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const VALID_USE_CASES = new Set([
  'content-creation',
  'coding',
  'marketing',
  'design',
  'research',
  'video',
  'sales',
  'customer-support',
])

const VALID_TEAM_SIZES = new Set([
  'solo',
  'small-team',
  'mid-size',
  'enterprise',
])

const VALID_INTEGRATIONS = new Set([
  'slack',
  'notion',
  'zapier',
  'google-drive',
  'github',
  'hubspot',
  'salesforce',
  'figma',
])

const USE_CASE_BY_CATEGORY = new Map([
  ['ai-chat', 'content-creation'],
  ['image-generation', 'design'],
  ['writing', 'content-creation'],
  ['coding', 'coding'],
  ['video', 'video'],
  ['audio', 'content-creation'],
  ['productivity', 'marketing'],
  ['business', 'marketing'],
  ['education', 'research'],
  ['design', 'design'],
  ['research', 'research'],
  ['seo', 'marketing'],
  ['voice', 'content-creation'],
  ['data-analytics', 'research'],
  ['automation', 'marketing'],
  ['social-media', 'marketing'],
  ['translation', 'content-creation'],
  ['summarization', 'research'],
  ['3d-animation', 'design'],
  ['avatars', 'design'],
  ['presentations', 'content-creation'],
  ['ecommerce', 'sales'],
  ['search', 'research'],
  ['life-assistant', 'content-creation'],
  ['dating-social', 'marketing'],
  ['healthcare', 'research'],
  ['hr', 'sales'],
  ['customer-support', 'customer-support'],
  ['ai-supertools', 'research'],
])

// NEW: Blueprint Persona Identifiers
function identifyPersona(tool) {
  const text = `${tool.name} ${tool.tagline} ${tool.description}`.toLowerCase()
  
  if (text.includes('enterprise') || text.includes('sso') || text.includes('teams')) {
    return 'enterprise-ready'
  }
  if (text.includes('solo') || text.includes('creator') || text.includes('personal')) {
    return 'solo-creator'
  }
  if (text.includes('api') || text.includes('developer') || text.includes('deploy')) {
    return 'coding-powerhouse'
  }
  return null
}

const TEAM_SIZE_BY_CATEGORY = new Map([
  ['ai-chat', 'solo'],
  ['image-generation', 'solo'],
  ['writing', 'solo'],
  ['coding', 'small-team'],
  ['video', 'small-team'],
  ['audio', 'solo'],
  ['productivity', 'small-team'],
  ['business', 'mid-size'],
  ['education', 'small-team'],
  ['design', 'small-team'],
  ['research', 'small-team'],
  ['seo', 'mid-size'],
  ['voice', 'solo'],
  ['data-analytics', 'mid-size'],
  ['automation', 'mid-size'],
  ['social-media', 'mid-size'],
  ['translation', 'solo'],
  ['summarization', 'solo'],
  ['3d-animation', 'small-team'],
  ['avatars', 'solo'],
  ['presentations', 'small-team'],
  ['ecommerce', 'mid-size'],
  ['search', 'enterprise'],
  ['life-assistant', 'solo'],
  ['dating-social', 'small-team'],
  ['healthcare', 'mid-size'],
  ['hr', 'mid-size'],
  ['customer-support', 'mid-size'],
  ['ai-supertools', 'enterprise'],
])

const INTEGRATIONS_BY_USE_CASE = {
  coding: ['github', 'slack', 'notion'],
  design: ['figma', 'google-drive', 'notion'],
  video: ['google-drive', 'zapier', 'notion'],
  marketing: ['hubspot', 'zapier', 'slack'],
  research: ['notion', 'google-drive', 'slack'],
  'content-creation': ['notion', 'google-drive', 'zapier'],
  sales: ['salesforce', 'hubspot', 'slack'],
  'customer-support': ['slack', 'salesforce', 'zapier'],
}

function parseArgs(argv) {
  const values = [...argv]
  const get = (name, fallback = null) => {
    const eqArg = values.find((arg) => arg.startsWith(`${name}=`))
    if (eqArg) return eqArg.slice(name.length + 1)
    const idx = values.indexOf(name)
    if (idx >= 0 && idx + 1 < values.length && !values[idx + 1].startsWith('--')) {
      return values[idx + 1]
    }
    return fallback
  }

  const asInt = (raw, fallback) => {
    if (raw == null) return fallback
    const n = Number.parseInt(raw, 10)
    return Number.isFinite(n) && n >= 0 ? n : fallback
  }

  return {
    apply: values.includes('--apply'),
    force: values.includes('--force'),
    status: get('--status', 'published'),
    limit: asInt(get('--limit', null), 0),
    sample: asInt(get('--sample', null), 10),
    concurrency: asInt(get('--concurrency', null), 8),
  }
}

function compactToolText(tool) {
  return `${tool.name || ''} ${tool.tagline || ''} ${tool.description || ''} ${tool.website_url || ''}`.toLowerCase()
}

function inferUseCase(tool) {
  const categorySlug = tool.categories?.slug || ''
  const text = compactToolText(tool)

  if (/customer support|help ?desk|ticketing|support inbox|live chat/.test(text)) return 'customer-support'
  if (/sales pipeline|lead generation|crm|prospect|sales outreach/.test(text)) return 'sales'
  return USE_CASE_BY_CATEGORY.get(categorySlug) || 'content-creation'
}

function inferTeamSize(tool) {
  const categorySlug = tool.categories?.slug || ''
  const text = compactToolText(tool)

  if (/enterprise|sso|soc ?2|compliance|large organization|department/.test(text)) return 'enterprise'
  if (/solo|personal|individual|creator|freelancer|student/.test(text)) return 'solo'
  return TEAM_SIZE_BY_CATEGORY.get(categorySlug) || 'small-team'
}

function inferIntegrations(tool, useCase) {
  const text = compactToolText(tool)
  const picks = []
  const add = (value) => {
    if (!VALID_INTEGRATIONS.has(value)) return
    if (!picks.includes(value)) picks.push(value)
  }

  if (/slack/.test(text)) add('slack')
  if (/notion/.test(text)) add('notion')
  if (/zapier|make\.com|ifttt/.test(text)) add('zapier')
  if (/google drive|google docs|google sheets|workspace/.test(text)) add('google-drive')
  if (/github|gitlab|bitbucket|repository|codebase/.test(text)) add('github')
  if (/hubspot/.test(text)) add('hubspot')
  if (/salesforce|crm/.test(text)) add('salesforce')
  if (/figma/.test(text)) add('figma')

  for (const integration of INTEGRATIONS_BY_USE_CASE[useCase] || []) add(integration)
  if (picks.length === 0) {
    add('notion')
    add('google-drive')
    add('zapier')
  }

  return picks.slice(0, 4)
}

function isMissing(value) {
  if (value == null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  return false
}

async function fetchJson(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      ...(init.headers || {}),
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Supabase request failed (${res.status}): ${body}`)
  }

  if (res.status === 204) return null
  return res.json()
}

async function fetchTools(status, limit) {
  const pageSize = 500
  const rows = []
  let offset = 0

  // Check if target_audience exists
  let hasTargetAudience = false
  try {
    const checkUrl = new URL(`${SUPABASE_URL}/rest/v1/tools`)
    checkUrl.searchParams.set('select', 'target_audience')
    checkUrl.searchParams.set('limit', '1')
    await fetchJson(checkUrl.toString())
    hasTargetAudience = true
  } catch (err) {
    console.warn('[compare-backfill] target_audience column not found, skipping related logic.')
  }

  while (true) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/tools`)
    const fields = ['id', 'slug', 'name', 'tagline', 'description', 'website_url', 'status', 'use_case', 'team_size', 'integrations', 'categories(slug)']
    if (hasTargetAudience) fields.push('target_audience')
    
    url.searchParams.set('select', fields.join(','))
    url.searchParams.set('order', 'created_at.asc')
    url.searchParams.set('limit', String(pageSize))
    url.searchParams.set('offset', String(offset))
    if (status && status !== 'all') url.searchParams.set('status', `eq.${status}`)

    const page = await fetchJson(url.toString())
    if (!Array.isArray(page) || page.length === 0) break

    rows.push(...page)
    if (limit > 0 && rows.length >= limit) break
    if (page.length < pageSize) break
    offset += pageSize
  }

  return { tools: limit > 0 ? rows.slice(0, limit) : rows, hasTargetAudience }
}

function inferDeepCapabilities(tool) {
  const text = compactToolText(tool)
  const patch = {}
  
  if (/api|sdk|developer documentation|rest endpoint|webhooks/.test(text)) patch.has_api = true
  if (/app store|play store|ios app|android app|mobile-friendly/.test(text)) patch.has_mobile_app = true
  if (/chrome extension|browser extension|firefox add-on/.test(text)) patch.has_browser_extension = true
  if (/open source|github repo|mit license|apache license/.test(text)) patch.is_open_source = true
  
  if (/credit|token|usage-based|pay as you go/.test(text)) patch.pricing_type = 'usage-based'
  else if (/subscription|monthly|yearly|billed/.test(text)) patch.pricing_type = 'subscription'
  else if (/one-time|lifetime|buy once/.test(text)) patch.pricing_type = 'one-time'
  
  return patch
}

function buildPatches(tools, force, hasTargetAudience) {
  return tools
    .map((tool) => {
      const nextUseCase = inferUseCase(tool)
      const nextTeamSize = inferTeamSize(tool)
      const nextIntegrations = inferIntegrations(tool, nextUseCase)
      const nextPersona = identifyPersona(tool)
      const deepCaps = inferDeepCapabilities(tool)
      
      const patch = { ...deepCaps }

      if (force || isMissing(tool.use_case)) patch.use_case = nextUseCase
      if (force || isMissing(tool.team_size)) patch.team_size = nextTeamSize
      if (force || isMissing(tool.integrations)) patch.integrations = nextIntegrations
      if (hasTargetAudience && (force || isMissing(tool.target_audience))) {
        if (nextPersona) patch.target_audience = nextPersona
      }

      if (!VALID_USE_CASES.has(patch.use_case ?? tool.use_case ?? '')) {
        throw new Error(`Invalid use_case for ${tool.slug}: ${patch.use_case ?? tool.use_case}`)
      }
      if (!VALID_TEAM_SIZES.has(patch.team_size ?? tool.team_size ?? '')) {
        throw new Error(`Invalid team_size for ${tool.slug}: ${patch.team_size ?? tool.team_size}`)
      }

      const targetIntegrations = patch.integrations ?? tool.integrations ?? []
      if (!Array.isArray(targetIntegrations) || targetIntegrations.some((value) => !VALID_INTEGRATIONS.has(value))) {
        throw new Error(`Invalid integrations for ${tool.slug}: ${JSON.stringify(targetIntegrations)}`)
      }

      return { id: tool.id, slug: tool.slug, patch }
    })
    .filter((item) => Object.keys(item.patch).length > 0)
}

function countMissing(tools) {
  return {
    use_case: tools.filter((tool) => isMissing(tool.use_case)).length,
    team_size: tools.filter((tool) => isMissing(tool.team_size)).length,
    integrations: tools.filter((tool) => isMissing(tool.integrations)).length,
  }
}

function printSummary(tools, patches) {
  const before = countMissing(tools)
  const wouldFill = {
    use_case: patches.filter((item) => Object.hasOwn(item.patch, 'use_case')).length,
    team_size: patches.filter((item) => Object.hasOwn(item.patch, 'team_size')).length,
    integrations: patches.filter((item) => Object.hasOwn(item.patch, 'integrations')).length,
  }

  console.log('[compare-backfill] Summary')
  console.log(`  tools scanned: ${tools.length}`)
  console.log(`  tools to update: ${patches.length}`)
  console.log(`  missing before: use_case=${before.use_case}, team_size=${before.team_size}, integrations=${before.integrations}`)
  console.log(`  fields to fill: use_case=${wouldFill.use_case}, team_size=${wouldFill.team_size}, integrations=${wouldFill.integrations}`)
}

async function runWithConcurrency(items, concurrency, worker) {
  const size = Math.max(1, concurrency)
  let cursor = 0
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const current = items[cursor]
      cursor += 1
      await worker(current)
    }
  })
  await Promise.all(workers)
}

async function applyPatches(patches, concurrency) {
  let updated = 0
  let failed = 0

  await runWithConcurrency(patches, concurrency, async (item) => {
    const url = `${SUPABASE_URL}/rest/v1/tools?id=eq.${encodeURIComponent(item.id)}`
    try {
      await fetchJson(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(item.patch),
      })
      updated += 1
    } catch (err) {
      failed += 1
      console.error(`[compare-backfill] Failed ${item.slug} (${item.id}): ${err.message}`)
    }
  })

  return { updated, failed }
}

async function main() {
  const start = Date.now()
  const args = parseArgs(process.argv.slice(2))

  console.log(`[compare-backfill] Mode: ${args.apply ? 'APPLY' : 'DRY RUN'}`)
  console.log(`[compare-backfill] Options: status=${args.status}, limit=${args.limit || 'all'}, force=${args.force}, concurrency=${args.concurrency}`)

  const { tools, hasTargetAudience } = await fetchTools(args.status, args.limit)
  const patches = buildPatches(tools, args.force, hasTargetAudience)
  printSummary(tools, patches)

  if (patches.length === 0) {
    console.log('[compare-backfill] Nothing to update')
    return
  }

  const sample = patches.slice(0, args.sample)
  console.log('[compare-backfill] Sample patches')
  for (const item of sample) {
    console.log(`  ${item.slug}: ${JSON.stringify(item.patch)}`)
  }

  if (!args.apply) {
    console.log('[compare-backfill] Dry run complete. Re-run with --apply to persist changes.')
    return
  }

  const result = await applyPatches(patches, args.concurrency)
  console.log(`[compare-backfill] Apply complete: updated=${result.updated}, failed=${result.failed}`)

  const { tools: refreshedTools } = await fetchTools(args.status, args.limit)
  const missingAfter = countMissing(refreshedTools)
  console.log(`[compare-backfill] Missing after: use_case=${missingAfter.use_case}, team_size=${missingAfter.team_size}, integrations=${missingAfter.integrations}`)
  console.log(`[compare-backfill] Done in ${Date.now() - start}ms`)
}

main().catch((err) => {
  console.error('[compare-backfill] Fatal:', err)
  process.exit(1)
})
