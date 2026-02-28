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

async function findPlatformTools() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Scanning for tools without dedicated websites...');
    
    const res = await client.query("SELECT id, name, website_url, slug FROM public.tools WHERE status = 'published'");
    
    const platformTools = res.rows.filter(row => {
      const url = row.website_url.toLowerCase();
      return url.includes('github.com') || 
             url.includes('twitter.com') ||
             url.includes('x.com') ||
             url.includes('discord.gg') ||
             url.includes('chromewebstore.google.com') ||
             url.includes('apps.apple.com') ||
             url.includes('play.google.com') ||
             url.includes('huggingface.co') ||
             url.includes('midjourney.com') || // Primarily Discord-based
             url.includes('openai.com/sora'); // Not a dedicated tool site yet
    });

    if (platformTools.length > 0) {
      console.log(`
Found ${platformTools.length} tools hosted on third-party platforms:`);
      platformTools.forEach(t => console.log(`- ${t.name} (${t.website_url})`));
    } else {
      console.log('✅ All tools seem to have their own dedicated domains.');
    }
    
  } catch (err) {
    console.error('Scan failed:', err);
  } finally {
    await client.end();
  }
}

findPlatformTools();
