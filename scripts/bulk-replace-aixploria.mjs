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

    const tables = [
      { name: 'public.tools', columns: ['name', 'tagline', 'description', 'pricing_details'] },
      { name: 'public.categories', columns: ['name', 'description'] },
      { name: 'public.blog_posts', columns: ['title', 'excerpt', 'content'] },
      { name: 'public.ai_news', columns: ['title', 'summary', 'source_name'] }
    ];

    for (const table of tables) {
      for (const column of table.columns) {
        const query = `
          UPDATE ${table.name}
          SET ${column} = REPLACE(${column}, 'AIxploria', 'AIPowerStacks')
          WHERE ${column} LIKE '%AIxploria%'
        `;
        const res = await client.query(query);
        if (res.rowCount > 0) {
          console.log(`Updated ${res.rowCount} rows in ${table.name}.${column}`);
        }
      }
    }

    console.log('\nBulk string replacement complete.');
  } catch (err) {
    console.error('Error during update:', err);
  } finally {
    await client.end();
  }
}

main();
