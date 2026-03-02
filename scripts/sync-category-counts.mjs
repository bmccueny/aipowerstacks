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

    // 1. Move Education tools back
    const educationCat = (await client.query("SELECT id FROM public.categories WHERE slug = 'education'")).rows[0];
    if (educationCat) {
      const toolsToMove = [
        'Edubrain AI',
        'Google Skills',
        'Learn Place AI Assistant',
        'Grain AI',
        'Mexty',
        'Math AI'
      ];
      
      const moveRes = await client.query(
        "UPDATE public.tools SET category_id = $1 WHERE name = ANY($2)",
        [educationCat.id, toolsToMove]
      );
      console.log(`Moved ${moveRes.rowCount} tools back to Education & Learning.`);
    }

    // 2. Sync all tool_counts
    console.log('Synchronizing category counts...');
    const syncRes = await client.query(`
      UPDATE public.categories c
      SET tool_count = (
        SELECT COUNT(*)
        FROM public.tools t
        WHERE t.category_id = c.id
        AND t.status = 'published'
      )
    `);
    console.log(`Synchronized counts for ${syncRes.rowCount} categories.`);

    // 3. Verify Education count
    const verifyRes = await client.query("SELECT name, tool_count FROM public.categories WHERE slug = 'education'");
    console.log('\nVerified Education Category:', verifyRes.rows[0]);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
