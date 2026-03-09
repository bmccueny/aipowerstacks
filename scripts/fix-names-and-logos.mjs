/**
 * fix-names-and-logos.mjs
 * 1. Cleans tool names: strips everything after the first colon (e.g. "CodeRabbit:AI-Powered..." → "CodeRabbit")
 * 2. Fetches favicons for published tools missing logo_url
 *    - Tries Clearbit logo API first (higher quality)
 *    - Falls back to Google S2 favicons
 */
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
      process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  } catch (e) {}
}
loadEnv();

const conn = process.env.DATABASE_URL || 'postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres';
const client = new Client({ connectionString: conn });

async function fetchWithTimeout(url, ms = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function getFaviconUrl(domain) {
  // Try Clearbit first — returns proper company logos
  const clearbit = `https://logo.clearbit.com/${domain}`;
  try {
    const res = await fetchWithTimeout(clearbit);
    if (res.ok) return clearbit;
  } catch {}

  // Fall back to Google S2 favicons
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

async function run() {
  await client.connect();
  console.log('Connected.\n');

  // ── Step 1: Fix names with description suffixes ───────────────────────────
  // Patterns: "Brand:Description", "Brand – Description", "Brand - Description"
  function cleanName(name) {
    return name
      .split(/\s+[–—-]\s+/)[0]  // em dash, en dash, or hyphen surrounded by spaces
      .split(':')[0]             // colon
      .trim();
  }

  const dirtyRes = await client.query(
    "SELECT id, name FROM public.tools WHERE name LIKE '%:%' OR name LIKE '% – %' OR name LIKE '% — %' OR name LIKE '% - %'"
  );

  if (dirtyRes.rows.length === 0) {
    console.log('✅ No tools with description suffixes found.\n');
  } else {
    console.log(`Found ${dirtyRes.rows.length} tool(s) with description in name:`);
    for (const row of dirtyRes.rows) {
      const clean = cleanName(row.name);
      if (clean === row.name) continue; // nothing changed
      await client.query('UPDATE public.tools SET name = $1 WHERE id = $2', [clean, row.id]);
      console.log(`  ✅ "${row.name}" → "${clean}"`);
    }
    console.log();
  }

  // ── Step 2: Fetch favicons for tools missing logo_url ──────────────────────
  const missingRes = await client.query(
    "SELECT id, name, website_url FROM public.tools WHERE (logo_url IS NULL OR logo_url = '') AND status = 'published' AND website_url IS NOT NULL"
  );

  console.log(`Fetching favicons for ${missingRes.rows.length} tools missing logos...\n`);

  let success = 0, failed = 0;
  for (const row of missingRes.rows) {
    try {
      const domain = new URL(row.website_url).hostname;
      const logoUrl = await getFaviconUrl(domain);
      await client.query('UPDATE public.tools SET logo_url = $1 WHERE id = $2', [logoUrl, row.id]);
      console.log(`  ✅ ${row.name} → ${logoUrl}`);
      success++;
    } catch (e) {
      console.log(`  ❌ ${row.name}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} logos updated, ${failed} failed.`);
  await client.end();
}

run().catch(err => { console.error(err); process.exit(1); });
