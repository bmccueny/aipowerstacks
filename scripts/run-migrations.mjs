import pg from 'pg'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })

const migrations = [
  '20240201_add_profile_follows.sql',
  '20240202_add_template_id.sql',
  '20240203_add_challenges.sql',
]

await client.connect()
console.log('Connected to database\n')

for (const file of migrations) {
  const sql = readFileSync(resolve(__dirname, '../supabase/migrations', file), 'utf8')
  console.log(`Running ${file}...`)
  try {
    await client.query(sql)
    console.log(`  ✓ Done\n`)
  } catch (err) {
    console.error(`  ✗ Error: ${err.message}\n`)
  }
}

await client.end()
console.log('All migrations complete.')
