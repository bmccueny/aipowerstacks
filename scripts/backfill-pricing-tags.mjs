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

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres';

function getPricingTags(details, model) {
  if (!details || details === 'N/A') return [];
  const d = details.toLowerCase();
  const tags = new Set();

  if (d.includes('/month') || d.includes('/year') || d.includes('/week') || d.includes('subscription')) tags.add('Subscription');
  if (d.includes('per 1m') || d.includes('per 1k') || d.includes('per image') || d.includes('credit') || d.includes('usage-based') || d.includes('per second')) tags.add('Usage-Based');
  if (d.includes('lifetime') || d.includes('one-time')) tags.add('One-Time');
  if (d.includes('free tier') || d.includes('free plan') || d.includes('free basic') || d.includes('free limited') || model === 'free') tags.add('Free Tier');
  if (d.includes('contact') || d.includes('custom') || d.includes('enterprise') || model === 'contact') tags.add('Contact');

  return Array.from(tags);
}

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    // First ensure the column exists
    await client.query("ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS pricing_tags text[] DEFAULT '{}'");
    console.log('Ensured pricing_tags column exists');

    const res = await client.query("SELECT id, pricing_details, pricing_model FROM public.tools");
    console.log(`Processing ${res.rowCount} tools...`);

    for (const row of res.rows) {
      const tags = getPricingTags(row.pricing_details, row.pricing_model);
      if (tags.length > 0) {
        await client.query("UPDATE public.tools SET pricing_tags = $1 WHERE id = $2", [tags, row.id]);
      }
    }

    console.log('\nPricing tags backfill complete.');
  } catch (err) {
    console.error('Error during backfill:', err);
  } finally {
    await client.end();
  }
}

main();
