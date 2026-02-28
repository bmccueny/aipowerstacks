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

const URL_MAP = {
  'agent-tars': 'https://agenttars.ai',
  'semrush-one': 'https://www.semrush.com/lp/semrush-one/en/',
  'apple-creator-studio': 'https://developer.apple.com',
  'chatterbox-turbo': 'https://chatterbox.ai',
  'clickup-agents': 'https://clickup.com/ai',
  'cocoon': 'https://cocoon.com',
  'deepseek-math-v2': 'https://www.deepseek.com',
  'depth-anything-3': 'https://depth-anything.github.io',
  'devstral2-mistral': 'https://mistral.ai',
  'disco-google': 'https://research.google/blog/harnessing-diffusion-models-for-visual-design/',
  'glm-5': 'https://chatglm.cn',
  'glm-image': 'https://chatglm.cn',
  'glm-ocr': 'https://chatglm.cn',
  'goenhance-image-to-video-ai': 'https://goenhance.ai',
  'google-antigravity': 'https://google.com',
  'google-medasr': 'https://research.google',
  'google-skills': 'https://skillshop.google.com',
  'google-titansmiras': 'https://research.google',
  'holo-ai': 'https://holoai.io',
  'iquest-coder-v1': 'https://iquest.ai',
  'joyfun-ai': 'https://joyfun.ai',
  'kamo-1-kinetix': 'https://kinetix.tech',
  'lingbot-world': 'https://lingbot.ai',
  'live-avatar-alibaba': 'https://www.alibabacloud.com',
  'lyria-3': 'https://deepmind.google/technologies/lyria/',
  'manus-browser-operator': 'https://manus.ai',
  'marble-by-world-labs': 'https://www.worldlabs.ai',
  'meta-sam-3d': 'https://segment-anything.com',
  'moltbook': 'https://moltbook.ai',
  'musevideo': 'https://musevideo.ai',
  'musicai': 'https://musicai.io',
  'nano-banana-2': 'https://nanobanana.ai',
  'nano-banana-pro': 'https://nanobanana.ai',
  'nvidia-earth-2': 'https://www.nvidia.com/en-us/high-performance-computing/earth-2/',
  'nvidia-nemotron-3': 'https://build.nvidia.com/nvidia/nemotron-3-8b',
  'openclaw': 'https://openclaw.ai',
  'prism-openai': 'https://openai.com',
  'project-genie': 'https://deepmind.google',
  'roblox-cube-model': 'https://create.roblox.com',
  'sandbar-stream-ring': 'https://sandbar.ai',
  'sharp-apple': 'https://apple.com',
  'shopify-simgym': 'https://shopify.com',
  'sima-2': 'https://deepmind.google',
  't5gemma-2': 'https://ai.google.dev/gemma',
  'translategemma': 'https://ai.google.dev/gemma',
  'vidi2': 'https://vidi.ai',
  'waypoint-1-overworld': 'https://waypoint.ai',
  'weathernext-2': 'https://weathernext.ai',
  'wedlm': 'https://wedlm.ai'
};

async function forceFix() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database. Restoring corrupted links...');

    for (const [slug, url] of Object.entries(URL_MAP)) {
      console.log(`Restoring link for: ${slug} -> ${url}`);
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;
      await client.query("UPDATE public.tools SET website_url = $1, logo_url = $2 WHERE slug = $3", [url, faviconUrl, slug]);
    }
    
    console.log('✅ Link restoration complete.');
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await client.end();
  }
}

forceFix();
