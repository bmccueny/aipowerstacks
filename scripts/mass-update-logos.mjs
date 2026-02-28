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

async function massUpdate() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    const res = await client.query("SELECT id, website_url, name FROM public.tools WHERE status = 'published'");
    console.log(`Processing ${res.rows.length} tools...`);

    for (const row of res.rows) {
      try {
        const domain = new URL(row.website_url).hostname;
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        
        await client.query("UPDATE public.tools SET logo_url = $1 WHERE id = $2", [faviconUrl, row.id]);
        // console.log(`✅ Updated ${row.name}`);
      } catch (e) {
        console.error(`Failed ${row.name}:`, e.message);
      }
    }
    
    console.log('Mass logo update complete.');
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await client.end();
  }
}

massUpdate();
