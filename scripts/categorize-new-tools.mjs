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

const CATEGORY_MAP = {
  'video': ['sora-2', 'runway-gen-3', 'synthesia-avatar', 'descript-ai'],
  'coding': ['devin-pro', 'cursor-editor'],
  'image-generation': ['midjourney-v7'],
  'search': ['perplexity-enterprise'],
  'writing': ['jasper-brand-voice', 'copy-ai', 'writesonic-ai'],
  'presentations': ['gamma-app', 'beautiful-ai', 'tome-ai'],
  'audio': ['elevenlabs-dubbing', 'murf-ai', 'lovo-ai', 'speechify-ai'],
  'productivity': ['otter-ai', 'fireflies-ai']
};

async function categorize() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    for (const [slug, tools] of Object.entries(CATEGORY_MAP)) {
      const catRes = await client.query("SELECT id FROM public.categories WHERE slug = $1", [slug]);
      if (catRes.rows.length > 0) {
        const catId = catRes.rows[0].id;
        console.log(`Updating ${tools.length} tools for category ${slug}...`);
        await client.query("UPDATE public.tools SET category_id = $1 WHERE slug = ANY($2)", [catId, tools]);
      }
    }
    console.log('Categorization complete.');
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await client.end();
  }
}

categorize();
