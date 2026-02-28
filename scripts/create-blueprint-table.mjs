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
    console.log('Connected to database');

    console.log('Creating blueprint_requests table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.blueprint_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        goal TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    console.log('Setting up RLS policies...');
    await client.query(`ALTER TABLE public.blueprint_requests ENABLE ROW LEVEL SECURITY;`);
    // Drop first to avoid duplicates
    await client.query(`DROP POLICY IF EXISTS "Anyone can submit blueprint requests" ON public.blueprint_requests;`);
    await client.query(`CREATE POLICY "Anyone can submit blueprint requests" ON public.blueprint_requests FOR INSERT WITH CHECK (true);`);
    
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log('Table and policies created successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
