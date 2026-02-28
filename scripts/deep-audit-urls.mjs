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

async function deepAudit() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Performing deep audit of all 260+ URLs...');
    
    const res = await client.query("SELECT id, name, website_url, slug FROM public.tools WHERE status = 'published'");
    
    const issues = [];

    for (const row of res.rows) {
      const url = row.website_url;
      
      // 1. Check for missing TLD (e.g. https://claudecode instead of claude.ai)
      try {
        const domain = new URL(url).hostname;
        if (!domain.includes('.')) {
          issues.push({ ...row, reason: 'Missing TLD (Incomplete Domain)' });
          continue;
        }
      } catch (e) {
        issues.push({ ...row, reason: 'Invalid URL Format' });
        continue;
      }

      // 2. Check for suspicious length or placeholders
      if (url.length < 12) {
        issues.push({ ...row, reason: 'Suspiciously short URL' });
      }
    }

    if (issues.length > 0) {
      console.log(`Found ${issues.length} malformed or incomplete URLs:`);
      console.log(JSON.stringify(issues, null, 2));
    } else {
      console.log('✅ All URLs passed the structural integrity check.');
    }
    
  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await client.end();
  }
}

deepAudit();
