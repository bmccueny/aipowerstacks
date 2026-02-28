import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (e) { console.warn('.env.local not found'); }
}
loadEnv();

const connectionString = process.env.DATABASE_URL;

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Adding Enterprise columns...');
    
    // Core Capabilities
    await client.query(`ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS has_api boolean DEFAULT false;`);
    await client.query(`ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS has_mobile_app boolean DEFAULT false;`);
    await client.query(`ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS has_browser_extension boolean DEFAULT false;`);
    await client.query(`ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS is_open_source boolean DEFAULT false;`);
    await client.query(`ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS pricing_type text;`);
    
    // Enterprise Signals
    await client.query(`ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS trains_on_data boolean DEFAULT true;`);
    await client.query(`ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS has_sso boolean DEFAULT false;`);
    await client.query(`ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS model_provider text;`);
    await client.query(`ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS update_velocity text;`);
    await client.query(`ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS security_certifications text[];`);
    
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log('All columns added and schema reloaded.');
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await client.end();
  }
}

run();
