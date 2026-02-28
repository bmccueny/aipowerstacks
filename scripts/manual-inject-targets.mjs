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

const DATA = [
  {
    slug: 'perplexity-enterprise',
    logo_url: 'https://www.perplexity.ai/favicon.ico',
    description: 'Perplexity Enterprise is an AI-powered search and answer engine designed for teams. It provides real-time information with cited sources, collaborative workspaces, and enterprise-grade security including SSO and SOC2 compliance.',
    pricing_model: 'paid',
    has_sso: true,
    security_certifications: ['SOC2', 'GDPR']
  },
  {
    slug: 'midjourney-v7',
    logo_url: 'https://www.midjourney.com/favicon.ico',
    description: 'Midjourney v7 is the latest evolution of the world-leading generative AI for images. It offers unparalleled realism, complex scene understanding, and advanced aesthetic control for professional artists and designers.',
    pricing_model: 'paid',
    model_provider: 'Proprietary'
  },
  {
    slug: 'devin-pro',
    logo_url: 'https://www.cognition.ai/favicon.ico',
    description: 'Devin Pro by Cognition is the first fully autonomous AI software engineer. It can plan and execute complex engineering tasks, learn new technologies, and build and deploy apps end-to-end.',
    pricing_model: 'paid',
    has_api: true,
    has_sso: true
  },
  {
    slug: 'sora-2',
    logo_url: 'https://openai.com/favicon.ico',
    description: 'Sora 2 is OpenAI’s advanced text-to-video model. It can create realistic and imaginative scenes from text instructions, generating high-fidelity videos up to a minute long while maintaining visual quality and adherence to the user’s prompt.',
    pricing_model: 'paid',
    model_provider: 'OpenAI'
  },
  {
    slug: 'gamma-app',
    logo_url: 'https://gamma.app/favicon.ico',
    description: 'Gamma is a new medium for presenting ideas, powered by AI. Create beautiful, interactive presentations, memos, and briefs in seconds—no design skills required. Perfect for fast-moving teams.',
    pricing_model: 'freemium',
    has_sso: true
  }
];

async function inject() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    for (const d of DATA) {
      console.log(`Injecting precision data for: ${d.slug}...`);
      await client.query(`
        UPDATE public.tools 
        SET logo_url = $1, description = $2, pricing_model = $3, has_sso = COALESCE($4, has_sso), security_certifications = COALESCE($5, security_certifications), model_provider = COALESCE($6, model_provider), has_api = COALESCE($7, has_api)
        WHERE slug = $8
      `, [d.logo_url, d.description, d.pricing_model, d.has_sso || null, d.security_certifications || null, d.model_provider || null, d.has_api || null, d.slug]);
    }
    
    console.log('Manual precision injection complete.');
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await client.end();
  }
}

inject();
