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
  { slug: 'adsturbo-ai-ads', details: 'Free tier ($0, 10-300 monthly credits); Paid plans from $149/month (Single User) to $1000/month (Agency, unlimited accounts); Free trial available.' },
  { slug: 'agent-tars', details: 'Freemium ($0/month); Premium ($499/month); Enterprise (Custom pricing).' },
  { slug: 'ai-background-remover', details: 'Free plans available (e.g., Adobe Express, Removal.AI low-res); Paid from $0.18/image (Remove.bg subscription) or $0.12/image (Removal.AI monthly); Lite plans from $7.20/month (Remove.bg).' },
  { slug: 'ai-landing-page', details: 'Free tiers available; Paid plans from $10/month (Basic) to $20/month (Pro); Enterprise from $57/month.' },
  { slug: 'ai-vector', details: 'Vertex AI: $0.0938084/hour (e2-standard-2) to $2.1279888/hour (n1-standard-32); Vector Search: $3.00/GiB processed.' },
  { slug: 'ai-video-enhancer-online', details: 'Free tiers; Paid from $39.95/month (AVCLabs); $12/month (Descript); $11/month (Speechify).' },
  { slug: 'aigne-docsmith', details: 'Free (open-source); No subscription fees mentioned.' },
  { slug: 'aipptcom', details: 'Free plan; Plus $9/month; Pro $11/month; Lifetime options from €5.9/month.' },
  { slug: 'airbrush', details: 'Free features; Premium tools optional (pricing not specified); Compressor/airbrush setup ~$100-$150 each.' },
  { slug: 'amazon-nova', details: 'Nova Act: $4.75/agent hour; Nova Forge: Annual subscription (custom); Bedrock: $0.00033-$0.00275/1K tokens.' },
  { slug: 'anylogogenerator', details: 'Free basic; Paid from $20-$199 (one-time or monthly); Enterprise $175.' },
  { slug: 'appark', details: 'Pricing details not found in results; Comparisons suggest custom or subscription-based.' },
  { slug: 'apple-creator-studio', details: '$12.99/month or $129/year; Students $2.99/month or $29.99/year; Free trial.' },
  { slug: 'ats-resume-checker', details: 'Free scans limited; Premium from $14.95/month; Some tools $49/month.' },
  { slug: 'beautyplus-image-enhancer', details: 'Free to use; Premium optional (details not specified).' },
  { slug: 'bigideasdb', details: 'Lite $49.99 (lifetime); Basic $99.99; Pro $199.99 (one-time payments).' },
  { slug: 'career-aptitude-test', details: 'Free options; Paid from $29.95-$199.95; Some $950 (full assessment).' },
  { slug: 'chatgpt-shopping', details: 'Included in ChatGPT plans: Free $0; Plus $20/month; Pro $200/month.' },
  { slug: 'chatgpt-translate', details: 'Included in ChatGPT plans: Free $0; Go $8/month; Plus $20/month.' },
  { slug: 'chatterbox-turbo', details: 'Free (open-source); API from $0.025/1K input chars; Pro plans from $39/month.' },
  { slug: 'clickup-agents', details: 'Unlimited $7/user/month; Business $12/user/month; Enterprise custom; AI add-ons $0.001/credit.' },
  { slug: 'cocoon', details: 'Custom pricing; Modular plans (details not specified).' },
  { slug: 'codeflying', details: 'Pricing details not found; Comparisons suggest from $16-$25/month.' },
  { slug: 'createwalink', details: 'Free basic; Premium $6 USD/year per link.' },
  { slug: 'dealism', details: 'From $19/month (Monthly Member); $32/month (Annual); Enterprise custom.' },
  { slug: 'dechecker', details: 'Pricing details not found; Similar tools from $9.99/user/month.' },
  { slug: 'deep-swap-ai', details: 'Free limited; 1-Month $9.99; 12-Month $49.99; Credits from $0.1/image.' },
  { slug: 'deepseek-math-v2', details: '$0.07/1M input (cache hit); $0.56/1M input (miss); $1.68/1M output.' },
  { slug: 'deepseek-v32', details: '$0.028/1M input (cache hit); $0.28/1M input (miss); $0.42/1M output.' },
  { slug: 'depth-anything-3', details: 'Free (open-source models).' },
  { slug: 'devstral2-mistral', details: 'Free (limited-time); Post-free: $0.40/1M input, $2.00/1M output (Devstral 2).' },
  { slug: 'diagrimo', details: 'Freemium; Paid from $6.99/month.' },
  { slug: 'disco-google', details: 'Free plans; Artist $10.80/month; Pro $26.99/month; Plus $16.99/month.' },
  { slug: 'elevenlabs-scribe-v2', details: 'Starter $5/month; Creator $11/month; Pro $99/month; $0.22/hour transcription.' },
  { slug: 'enhancephoto-ai', details: 'Free previews; Pay per image from $0.036/photo; Subscriptions from $6/month.' },
  { slug: 'ernie-50', details: '$0.00085/1M input; $0.0034/1M output (Qianfan).' },
  { slug: 'face-shape-detector', details: 'Free; Premium from $2.99/week; Lifetime $9.99.' },
  { slug: 'face-swap-ai', details: 'Free limited; Pro $14.99/month; Prime $29.99/month; One-time from $9.99.' },
  { slug: 'filmpitch', details: 'Pricing details not found; Pitch decks $300-$5,000; Coverage higher.' },
  { slug: 'findtubeai', details: 'Pricing details not found; Similar tools from $11.99/month.' },
  { slug: 'free-whatsapp-bulk-sender', details: 'Free; Pro/Classic $3/month; Subscriptions for unlimited.' },
  { slug: 'gemini-3', details: 'Free tier; Pro $19.99/month; Ultra $249.99/month.' },
  { slug: 'gemini-3-flash', details: 'Free tier; $0.25/1M input; $1.50/1M output (paid).' },
  { slug: 'gemini-personal-intelligence', details: 'Included in Pro $19.99/month or Ultra $249.99/month.' },
  { slug: 'generor', details: 'Pricing details not found; Similar generators $400-$23,000 (home generators).' },
  { slug: 'glm-47-flash', details: 'Free; $0.07/1M input; $0.40/1M output (paid).' },
  { slug: 'glm-5', details: '$0.20/1M cached input; $1.00/1M input; $3.20/1M output.' },
  { slug: 'glm-image', details: '$0.015/image.' },
  { slug: 'glm-ocr', details: '$0.03/1M tokens (input/output).' },
  { slug: 'google-antigravity', details: 'Individual $0/month; Developer via Google One; Team via Workspace (custom).' }
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
    
    console.log('\nBatch 1 pricing update complete.');
  } catch (err) {
    console.error('Error during update:', err);
  } finally {
    await client.end();
  }
}

main();
