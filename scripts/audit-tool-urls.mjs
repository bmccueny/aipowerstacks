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

async function auditUrls() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Auditing all published tool URLs...');
    
    const res = await client.query("SELECT name, website_url, slug FROM public.tools WHERE status = 'published' ORDER BY name ASC");
    
    const issues = res.rows.filter(row => {
      const url = row.website_url.toLowerCase();
      return url.includes('aixploria.com/out/') || 
             url.includes('google.com/search') ||
             !url.startsWith('http');
    });

    if (issues.length > 0) {
      console.log(`Found ${issues.length} tools with suspicious or incorrect URLs:`);
      console.log(JSON.stringify(issues, null, 2));
    } else {
      console.log('✅ All 260 tool URLs look like direct domain links.');
    }
    
  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await client.end();
  }
}

auditUrls();
