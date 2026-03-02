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

const pricingData = [
  { slug: 'product-link-to-video', details: 'From $10/month (Starter) to $39/month (Pro), with enterprise custom pricing. Some tools offer free tiers or trials.' },
  { slug: 'project-genie', details: 'Requires Google AI Ultra subscription at $249.99/month.' },
  { slug: 'pxz-video-generator', details: 'Freemium from $6.40/month (Basic) to $89/month (Pro), credit-based system.' },
  { slug: 'qwen-35', details: 'Free for open-source models; API pricing from $0.05-$0.40 per 1M tokens depending on model size.' },
  { slug: 'qwen3-tts', details: 'Freemium from $0.02 per 1K characters; subscriptions from $1.92/week.' },
  { slug: 'rankin-ai', details: 'Free (Scout) to $199/month (Trailblazer), with custom enterprise plans.' },
  { slug: 'reelmate-ai', details: 'From $9/month (Starter) to $30/month (Premium).' },
  { slug: 'reelmuse-ai', details: 'From $9.9/month (Starter) to $59.9/month (Ultra Studio).' },
  { slug: 'reflyai', details: 'From $0 (Free) to $24.9/month (Max), with annual discounts.' },
  { slug: 'remove-watermarks-markgone', details: 'Freemium with 3 free credits/day; from $11.25 (50 credits) to $37.52 (1000 credits).' },
  { slug: 'roblox-cube-model', details: 'Free and open-source; in-game uploads cost 750-2500 Robux (~$9-30 USD).' },
  { slug: 'rosie-ai', details: 'From $49/month (Professional) to $199/month (Growth), with custom plans from $999/month.' },
  { slug: 'runway-gen-45', details: 'From $12/month (Standard) to $76/month (Unlimited), credit-based.' },
  { slug: 'safenew-ai', details: 'From $9.99/month (Standard) to $29.99/month (Ultra).' },
  { slug: 'seedance-15-pro', details: 'From $0.07/second (API); subscriptions from $10/month.' },
  { slug: 'seedream-45', details: '~$0.035-$0.045 per image; credit-based plans from $0.038/pic.' },
  { slug: 'seedream-50', details: '~$0.035-$0.045 per image; ~$0.0275/image on some platforms.' },
  { slug: 'semrush-one', details: 'From $199/month (Starter) to $549/month (Advanced).' },
  { slug: 'sharp-apple', details: 'Free and open-source (SHARP model).' },
  { slug: 'shopify-simgym', details: 'Free to install; $10 per simulation run after trial credits.' },
  { slug: 'shutterstock', details: 'From $29 (10 images) to $169/month (350 images); video/audio from $5+.' },
  { slug: 'sima-2', details: 'Free/open-source research model; no commercial pricing mentioned.' },
  { slug: 'sketchbubble-ai', details: 'Free; Pro from $15/month (AI Maker) to $50/month (Templates).' },
  { slug: 'sketchflowai', details: 'Freemium from $25/month.' },
  { slug: 'song-maker-ai', details: 'From $10.49/month (Starter) to $20.99/month (Premium).' },
  { slug: 't5gemma-2', details: 'Free/open-source; deployment costs vary.' },
  { slug: 'taxtools-ai', details: 'From $19.92 (Pro) to $239 (First-Time Purchase).' },
  { slug: 'taylor-cpai-by-deduction', details: 'Subscription-based; exact pricing not specified (year-round model).' },
  { slug: 'text-to-song', details: 'From $8.90/month (Lite) to $17.90/month (Pro).' },
  { slug: 'texttohuman', details: 'Free (unlimited); API from $16/month (50k words).' },
  { slug: 'tgdesk', details: 'From $0 (Free) to $40/user/month (Enterprise).' },
  { slug: 'translategemma', details: 'Free/open-source; deployment costs vary.' },
  { slug: 'tripleten-burnout-test', details: 'Free.' },
  { slug: 'upcv', details: 'From ₹160-₹9500/sq ft depending on type and features.' },
  { slug: 'upmetrics-ai', details: 'From $19/month (Premium) to $49/month (Professional).' },
  { slug: 'ux-pilot-ai', details: 'Free; from $14/month (Standard) to $22/month (Pro).' },
  { slug: 'vadu-ai', details: 'From $8/month (Standard) to $79/month (Ultimate).' },
  { slug: 'vibe-architect', details: 'Custom pricing; from $0 (Starter) to $39/user/month (Team).' },
  { slug: 'vibecodedev', details: 'From $20/month (Plus) to $200/month (Max), credit-based.' },
  { slug: 'video-watermark-remover', details: 'From $0.05/5 seconds; credit packs from $11.25.' },
  { slug: 'vidflux', details: 'From $6.75/month (Basic) to $44.25/month (Studio).' },
  { slug: 'vidi2', details: 'Free/open-source; custom enterprise pricing.' },
  { slug: 'vidmage', details: 'Free; from $9.99/month (Monthly) to $99.99/year (Yearly).' },
  { slug: 'visboom', details: 'Custom pricing; free trial available.' },
  { slug: 'visual-field-test', details: '$60-$105 per test; may be covered by insurance.' },
  { slug: 'voila-voice-io', details: 'From $14.99/month; free trial available.' },
  { slug: 'vomo-ai', details: 'From $0 (Free) to $7.99/week (Pro).' },
  { slug: 'vora', details: 'From $12.99/month (Pro); free tier available.' },
  { slug: 'wan26', details: 'From $9.9 (Starter) to $99.9 (Professional), credit-based.' },
  { slug: 'warmup-tool', details: 'From $19/month (Lite) to $279/month (High Volume).' },
  { slug: 'waypoint-1-overworld', details: 'Free/open-source.' },
  { slug: 'weathernext-2', details: 'Free/open-source research model; API access via Google Cloud (custom pricing).' },
  { slug: 'wedlm', details: 'Free/open-source.' },
  { slug: 'wellows', details: 'Free (Lite); from $37/month (Essential) to custom (Enterprise).' },
  { slug: 'weshop-ai', details: 'From $0 (Free) to $399/month (API); point-based.' },
  { slug: 'whatsapp-schedule-message', details: 'Per-message fees: $0.004-$0.1365 depending on category/country.' },
  { slug: 'writehybrid-ai-humanizer', details: 'From $19/month (Starter) to $99/month (Agency).' },
  { slug: 'yolly-ai', details: 'From $4.95/month; free trial available.' }
];

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    for (const item of pricingData) {
      const res = await client.query(
        "UPDATE public.tools SET pricing_details = $1 WHERE slug = $2",
        [item.details, item.slug]
      );
      
      if (res.rowCount > 0) {
        console.log(`Updated pricing for: ${item.slug}`);
      } else {
        console.log(`Failed to find tool: ${item.slug}`);
      }
    }
    
    console.log('\nBatch 3 pricing update complete.');
  } catch (err) {
    console.error('Error during update:', err);
  } finally {
    await client.end();
  }
}

main();
