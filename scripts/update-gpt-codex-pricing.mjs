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

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    const slug = 'gpt-5-3-codex';
    const pricingModel = 'paid';
    const pricingDetails = 'Starting at $20/month';

    const res = await client.query(
      "UPDATE public.tools SET pricing_model = $1, pricing_details = $2 WHERE slug = $3 OR name = 'GPT-5.3-Codex'",
      [pricingModel, pricingDetails, slug]
    );

    if (res.rowCount > 0) {
      console.log(`Successfully updated pricing for GPT-5.3-Codex to $20/month`);
    } else {
      console.log(`Tool not found. Make sure 'gpt-5-3-codex' exists in the database.`);
    }
  } catch (err) {
    console.error('Error updating tool:', err);
  } finally {
    await client.end();
  }
}

main();
