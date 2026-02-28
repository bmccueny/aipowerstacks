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
  } catch (e) { }
}
loadEnv();

const connectionString = process.env.DATABASE_URL;

async function checkLatest() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Checking latest 10 published tools...');
    const res = await client.query(`
      SELECT name, slug, status, published_at, category_id 
      FROM public.tools 
      WHERE status = 'published' 
      ORDER BY published_at DESC 
      LIMIT 10
    `);
    console.log('Results:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await client.end();
  }
}

checkLatest();
