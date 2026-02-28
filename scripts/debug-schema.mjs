#!/usr/bin/env node
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

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
} catch { console.warn('.env.local not found') }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function checkColumn(col) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/tools`)
  url.searchParams.set('select', col)
  url.searchParams.set('limit', '1')
  
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  })
  
  if (res.ok) console.log(`✅ Column '${col}' exists`)
  else console.log(`❌ Column '${col}' FAILED: ${res.status} ${res.statusText}`)
}

async function main() {
  await checkColumn('id')
  await checkColumn('has_api')
  await checkColumn('has_mobile_app')
  await checkColumn('is_open_source')
  await checkColumn('pricing_type')
}

main()
