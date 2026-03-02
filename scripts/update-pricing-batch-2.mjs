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
  { slug: 'google-medasr', details: 'Free (open-source medical speech recognition model).' },
  { slug: 'google-skills', details: 'Starter: Free; Pro: $29/month; Career Certificates: $49/month.' },
  { slug: 'google-titansmiras', details: 'Free (research architecture and framework, open-source).' },
  { slug: 'gpt-image-15', details: 'Text: $5/1M input, $1.25/1M cached input, $10/1M output; Image: $8/1M input, $2/1M cached input, $32/1M output.' },
  { slug: 'grok-41', details: 'API: $0.20/1M input, $0.50/1M output; Subscriptions: Plus $20/month, Pro $200/month.' },
  { slug: 'grok-420', details: 'Early access (custom); As crypto: ~$0.001 USD (volatile).' },
  { slug: 'holo-ai', details: 'Starter: $19/month; Pro: $39/month; Enterprise: Custom.' },
  { slug: 'hunyuanvideo-15', details: '$0.075/second; Or 200 tokens/generation (~$0.02-0.04/second depending on resolution).' },
  { slug: 'infronai', details: 'Enterprise custom pricing.' },
  { slug: 'instories', details: 'Pro Monthly: $14.99; Pro Annual: $119.99.' },
  { slug: 'interview-qa-ai', details: 'From $0.99/interview; Monthly plans: $14.99-$49/month.' },
  { slug: 'iquest-coder-v1', details: 'Free (open-source code model).' },
  { slug: 'joyfun-ai', details: 'No subscription; Credit packs: $24.99/3000 credits; Premium: $59.99/20000 credits.' },
  { slug: 'kamo-1-kinetix', details: 'Free (research/open-source).' },
  { slug: 'kimi-k25', details: '$0.10-0.60/1M input, $3/1M output.' },
  { slug: 'kirkify-ai', details: 'Starter: $4.99/20 credits; Pro: $9.99/50 credits.' },
  { slug: 'kogents-ai', details: 'Custom; $70-150/hour.' },
  { slug: 'kutt-ai', details: 'From $9.9/400 credits; Up to $159.9/9400 credits/month.' },
  { slug: 'landing-page-ai-builder', details: 'From $10/month Basic; Enterprise: $57/month.' },
  { slug: 'lingbot-world', details: 'Free (open-source world simulator).' },
  { slug: 'listagrow-ai', details: 'From $19.99/month (150 credits); Up to $149.99/month (5000 credits).' },
  { slug: 'litvideo', details: 'Monthly: $14.99; Yearly: $89.99; Lifetime: $125.97.' },
  { slug: 'live-avatar-alibaba', details: 'Free (open-source framework).' },
  { slug: 'live3d-ai-face-swap', details: 'Free; Lite: $3.9/month; Plus: $16.9/month; Pro: $49.9/month.' },
  { slug: 'lyria-3', details: 'Included in Google AI Plus: $99/month; Pro: $395/month; Ultra: $4949/month.' },
  { slug: 'manus-browser-operator', details: 'Custom pricing; ~$200/month for similar tools.' },
  { slug: 'marble-by-world-labs', details: 'Standard: $20/month; Pro: $35/month; Max: $95/month.' },
  { slug: 'meta-sam-3d', details: 'Basic: $9.90/month; Pro: $29.90/month; Max: $59.90/month.' },
  { slug: 'minimax-m21', details: '$0.27/1M input, $0.95/1M output.' },
  { slug: 'moltbook', details: 'As crypto: ~$0.000013 USD (volatile).' },
  { slug: 'myneutron-ai-memory', details: 'Basic: $4.99/month; Pro: $14.99/month.' },
  { slug: 'nano-banana-2', details: '~$0.08/image (standard); Higher resolutions: $0.12-0.16/image.' },
  { slug: 'nano-banana-pro', details: '2K: $0.139/image; 4K: $0.24/image; Free tier: 3/day.' },
  { slug: 'nexosai', details: 'Pro: €20/user/month; Enterprise: Custom.' },
  { slug: 'nextifyai', details: 'Starter: $27.25/month; Pro: $69.3/month; Business: $147/month.' },
  { slug: 'noiz-agent', details: 'Free; Pro: $14.99/month.' },
  { slug: 'nvidia-earth-2', details: 'Custom/enterprise pricing.' },
  { slug: 'nvidia-nemotron-3', details: '$0.05/1M input, $0.20/1M output.' },
  { slug: 'openclaw', details: 'Free software; Running costs: $6-200+/month (hardware + APIs).' },
  { slug: 'openmusic-ai', details: 'Starter: $10.49/month; Hobby: $20.99/month; Professional: $49.99/month.' },
  { slug: 'photiu', details: 'Free; Small fee for HD downloads.' },
  { slug: 'photo-editor-ai', details: 'Free; Pro: $9.99/month.' },
  { slug: 'photocat-image-extender', details: 'Free; Pro: $59.99/year.' },
  { slug: 'pipedrive', details: 'Essential: $14.90/month; Advanced: $24.90/month; Professional: $49.90/month; Enterprise: Custom.' },
  { slug: 'pixalytica', details: 'Starter: $79.99/month; Growth: $799.99/month; Scale: $6999.99/month.' },
  { slug: 'pixazo', details: 'From $5/5000 credits; Usage-based.' },
  { slug: 'pixpretty-ai-photo-editor', details: 'Plus: $9.09/month; Pro: $39.99/month.' },
  { slug: 'png-ai', details: 'Free; Basic: $10/month; Plus: $20/month.' },
  { slug: 'postwizard-ai', details: 'Pro: $6.99/month.' },
  { slug: 'prism-openai', details: 'Free (AI workspace for research).' }
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
    
    console.log('\nBatch 2 pricing update complete.');
  } catch (err) {
    console.error('Error during update:', err);
  } finally {
    await client.end();
  }
}

main();
