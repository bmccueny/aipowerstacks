import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const env = readFileSync('.env.local', 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1]
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1]
const supabase = createClient(url, key)

async function main() {
  const { data } = await supabase.from('tools').select('website_url')
  console.log(JSON.stringify(data.map(t => new URL(t.website_url).hostname.replace('www.', ''))))
}

main()
