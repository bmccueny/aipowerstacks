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

    const catRes = await client.query(`
      SELECT c.id, c.name, c.slug, COUNT(t.id) as tool_count
      FROM public.categories c
      LEFT JOIN public.tools t ON t.category_id = c.id
      GROUP BY c.id, c.name, c.slug
      ORDER BY tool_count DESC, c.name ASC
    `);

    console.log('Current Category Distribution:');
    catRes.rows.forEach(row => {
      console.log(`${row.name} (${row.slug}): ${row.tool_count} tools`);
    });

    const uncatRes = await client.query(`
      SELECT COUNT(*) FROM public.tools WHERE category_id IS NULL
    `);
    console.log(`\nUncategorized tools: ${uncatRes.rows[0].count}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
