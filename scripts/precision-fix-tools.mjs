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

const PRECISION_FIXES = [
  { slug: 'seedance-20', url: 'https://seedance.ai' },
  { slug: 'gpt-image-15', url: 'https://openai.com' },
  { slug: 'gpt-52', url: 'https://openai.com' },
  { slug: 'hunyuanvideo-15', url: 'https://hunyuan.tencent.com' },
  { slug: 'kimi-k25', url: 'https://kimi.moonshot.cn' },
  { slug: 'minimax-m21', url: 'https://minimaxi.com' },
  { slug: 'minimax-m25', url: 'https://minimaxi.com' },
  { slug: 'runway-gen-45', url: 'https://runwayml.com' },
  { slug: 'seedream-45', url: 'https://seedream.ai' },
  { slug: 'seedream-50', url: 'https://seedream.ai' },
  { slug: 'sonnet-46', url: 'https://claude.ai' },
  { slug: 'wan26', url: 'https://wanai.com' }
];

async function precisionFix() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    for (const f of PRECISION_FIXES) {
      console.log(`Precision fixing: ${f.slug}...`);
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(f.url).hostname}&sz=128`;
      await client.query("UPDATE public.tools SET website_url = $1, logo_url = $2 WHERE slug = $3", [f.url, faviconUrl, f.slug]);
    }
    
    console.log('Precision fixes complete.');
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await client.end();
  }
}

precisionFix();
