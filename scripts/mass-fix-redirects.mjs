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

const FIXES = [
  { slug: 'claude-code', url: 'https://claude.ai' },
  { slug: 'gemini-3', url: 'https://gemini.google.com' },
  { slug: 'amazon-nova', url: 'https://aws.amazon.com/ai/generative-ai/nova/' },
  { slug: 'chatgpt-health', url: 'https://chatgpt.com' },
  { slug: 'chatgpt-shopping', url: 'https://chatgpt.com' },
  { slug: 'chatgpt-translate', url: 'https://chatgpt.com' },
  { slug: 'claude-healthcare', url: 'https://claude.ai' },
  { slug: 'claude-opus-45', url: 'https://claude.ai' },
  { slug: 'claude-opus-46', url: 'https://claude.ai' },
  { slug: 'deepseek-v32', url: 'https://www.deepseek.com' },
  { slug: 'elevenlabs-scribe-v2', url: 'https://elevenlabs.io' },
  { slug: 'ernie-50', url: 'https://erniebot.baidu.com' },
  { slug: 'flux2', url: 'https://blackforestlabs.ai' },
  { slug: 'gemini-3-flash', url: 'https://gemini.google.com' },
  { slug: 'gemini-31-pro', url: 'https://gemini.google.com' },
  { slug: 'gemini-personal-intelligence', url: 'https://gemini.google.com' },
  { slug: 'grok-41', url: 'https://x.ai' },
  { slug: 'grok-420', url: 'https://x.ai' },
  { slug: 'pipedrive', url: 'https://www.pipedrive.com' },
  { slug: 'shutterstock', url: 'https://www.shutterstock.com/ai-image-generator' },
  { slug: 'qwen-35', url: 'https://chat.qwenlm.ai' }
];

async function fix() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    for (const f of FIXES) {
      console.log(`Fixing redirect for: ${f.slug}...`);
      await client.query("UPDATE public.tools SET website_url = $1 WHERE slug = $2", [f.url, f.slug]);
    }
    
    // Generic clean for any I missed - remove the prefix
    console.log('Performing generic cleanup for remaining redirects...');
    await client.query(`
      UPDATE public.tools 
      SET website_url = 'https://' || LOWER(REPLACE(website_url, 'https://www.aixploria.com/out/', ''))
      WHERE website_url LIKE 'https://www.aixploria.com/out/%'
    `);

    console.log('Redirect cleanup complete.');
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await client.end();
  }
}

fix();
