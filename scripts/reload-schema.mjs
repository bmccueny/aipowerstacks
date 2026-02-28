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
if (!connectionString) { console.error('DATABASE_URL missing'); process.exit(1); }

async function reloadSchema() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Reloading PostgREST schema cache...');
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('Done.');
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await client.end();
  }
}

reloadSchema();
