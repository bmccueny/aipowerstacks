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

const toolLogos = [
  { slug: 'notion-ai', logo: 'https://www.google.com/s2/favicons?domain=notion.so&sz=128' },
  { slug: 'obsidian-ai', logo: 'https://www.google.com/s2/favicons?domain=obsidian.md&sz=128' },
  { slug: 'mem-ai', logo: 'https://www.google.com/s2/favicons?domain=mem.ai&sz=128' }
];

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    for (const tool of toolLogos) {
      const res = await client.query(
        "UPDATE public.tools SET logo_url = $1 WHERE slug = $2",
        [tool.logo, tool.slug]
      );
      
      if (res.rowCount > 0) {
        console.log(`Updated logo for: ${tool.slug}`);
      } else {
        console.log(`Failed to find tool: ${tool.slug}`);
      }
    }
    
    console.log('\nNote-taking app logos updated successfully.');
  } catch (err) {
    console.error('Error during update:', err);
  } finally {
    await client.end();
  }
}

main();
