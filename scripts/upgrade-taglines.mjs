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

const TAGLINE_UPGRADES = [
  { slug: 'speechify-ai', tagline: 'The #1 AI Voice Reader for PDFs, Web & Docs' },
  { slug: 'lovo-ai', tagline: 'Award-winning AI Voice Generator with 500+ Realistic Voices' },
  { slug: 'murf-ai', tagline: 'Professional Studio-Quality AI Voiceovers in Minutes' },
  { slug: 'descript-ai', tagline: 'Edit Video & Audio as Easily as a Text Document' },
  { slug: 'fireflies-ai', tagline: 'Automate Meeting Notes & Insights Across All Platforms' },
  { slug: 'otter-ai', tagline: 'Real-time AI Transcription & Smart Meeting Summaries' },
  { slug: 'writesonic-ai', tagline: 'AI-Powered SEO Writer for Blogs, Ads & Product Descriptions' },
  { slug: 'copy-ai', tagline: 'The AI Growth Platform for High-Converting Marketing Copy' },
  { slug: 'tome-ai', tagline: 'AI-Powered Storytelling & Interactive Presentations' },
  { slug: 'beautiful-ai', tagline: 'Presentation Software that Designs Itself with AI' },
  { slug: 'gamma-app', tagline: 'Create Stunning Presentations & Webpages via AI Chat' },
  { slug: 'elevenlabs-dubbing', tagline: 'The Worlds Most Realistic AI Speech & Video Dubbing' },
  { slug: 'synthesia-avatar', tagline: 'Create AI Video from Text with Realistic Digital Avatars' },
  { slug: 'runway-gen-3', tagline: 'Next-Gen Cinematic AI Video Synthesis & Motion Control' },
  { slug: 'jasper-brand-voice', tagline: 'AI Marketing Agent that Learns & Writes in Your Brand Voice' },
  { slug: 'cursor-editor', tagline: 'The AI-First Code Editor Built for Speed & Efficiency' },
  { slug: 'perplexity-enterprise', tagline: 'AI-Powered Search & Research Engine for High-Growth Teams' },
  { slug: 'midjourney-v7', tagline: 'The Gold Standard for Hyper-Realistic Generative AI Art' },
  { slug: 'devin-pro', tagline: 'The First Fully Autonomous AI Software Engineer' },
  { slug: 'sora-2', tagline: 'OpenAIs Advanced Text-to-Video Model for Cinematic Clips' }
];

async function upgrade() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    for (const u of TAGLINE_UPGRADES) {
      console.log(`Upgrading tagline for: ${u.slug}...`);
      await client.query("UPDATE public.tools SET tagline = $1 WHERE slug = $2", [u.tagline, u.slug]);
    }
    
    console.log('Tagline precision upgrades complete.');
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await client.end();
  }
}

upgrade();
