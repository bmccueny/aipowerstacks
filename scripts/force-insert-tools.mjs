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

const TOOLS = [
  { name: 'Sora 2', url: 'https://openai.com/sora', tagline: 'Advanced text-to-video generation', slug: 'sora-2' },
  { name: 'Devin Pro', url: 'https://cognition.ai/devin', tagline: 'The first fully autonomous AI software engineer', slug: 'devin-pro' },
  { name: 'Midjourney v7', url: 'https://midjourney.com', tagline: 'Hyper-realistic image generation', slug: 'midjourney-v7' },
  { name: 'Perplexity Enterprise', url: 'https://perplexity.ai', tagline: 'AI-powered search engine for teams', slug: 'perplexity-enterprise' },
  { name: 'Cursor Editor', url: 'https://cursor.sh', tagline: 'The AI-first code editor', slug: 'cursor-editor' },
  { name: 'Jasper Brand Voice', url: 'https://jasper.ai', tagline: 'AI copywriter that learns your brand', slug: 'jasper-brand-voice' },
  { name: 'Runway Gen-3', url: 'https://runwayml.com', tagline: 'Next-gen video synthesis tools', slug: 'runway-gen-3' },
  { name: 'Synthesia Avatar', url: 'https://synthesia.io', tagline: 'AI video generation platform', slug: 'synthesia-avatar' },
  { name: 'ElevenLabs Dubbing', url: 'https://elevenlabs.io', tagline: 'AI voice generation and dubbing', slug: 'elevenlabs-dubbing' },
  { name: 'Gamma App', url: 'https://gamma.app', tagline: 'AI for generating presentations and webs', slug: 'gamma-app' },
  { name: 'Beautiful.ai', url: 'https://beautiful.ai', tagline: 'Generative presentation software', slug: 'beautiful-ai' },
  { name: 'Tome', url: 'https://tome.app', tagline: 'AI-powered storytelling format', slug: 'tome-ai' },
  { name: 'Copy.ai', url: 'https://copy.ai', tagline: 'AI powered copywriting for marketing', slug: 'copy-ai' },
  { name: 'Writesonic', url: 'https://writesonic.com', tagline: 'AI writer for SEO blogs and articles', slug: 'writesonic-ai' },
  { name: 'Otter.ai', url: 'https://otter.ai', tagline: 'AI meeting notes and transcription', slug: 'otter-ai' },
  { name: 'Fireflies.ai', url: 'https://fireflies.ai', tagline: 'Automate meeting notes', slug: 'fireflies-ai' },
  { name: 'Descript', url: 'https://descript.com', tagline: 'All-in-one video and audio editing', slug: 'descript-ai' },
  { name: 'Murf.ai', url: 'https://murf.ai', tagline: 'AI voice generator', slug: 'murf-ai' },
  { name: 'Lovo.ai', url: 'https://lovo.ai', tagline: 'AI voiceover and text to speech', slug: 'lovo-ai' },
  { name: 'Speechify', url: 'https://speechify.com', tagline: 'Text to speech reader', slug: 'speechify-ai' }
];

async function insert() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    const defaultCat = await client.query("SELECT id FROM public.categories LIMIT 1");
    const defaultCatId = defaultCat.rows[0].id;

    for (const t of TOOLS) {
      const check = await client.query("SELECT id FROM public.tools WHERE website_url = $1 OR slug = $2", [t.url, t.slug]);
      
      if (check.rows.length > 0) {
        console.log(`Updating ${t.name}...`);
        await client.query(`
          UPDATE public.tools 
          SET name = $1, tagline = $2, description = $3, status = 'published', published_at = NOW() 
          WHERE id = $4
        `, [t.name, t.tagline, t.tagline, check.rows[0].id]);
      } else {
        console.log(`Inserting ${t.name}...`);
        await client.query(`
          INSERT INTO public.tools (name, website_url, tagline, description, status, slug, published_at, category_id)
          VALUES ($1, $2, $3, $4, 'published', $5, NOW(), $6)
        `, [t.name, t.url, t.tagline, t.tagline, t.slug, defaultCatId]);
      }
    }
    
    console.log('Force upsert complete.');
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await client.end();
  }
}

insert();
