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

const newTools = [
  {
    name: 'Notion AI',
    slug: 'notion-ai',
    tagline: 'Your connected workspace, now with integrated AI intelligence.',
    description: 'Notion AI is a integrated suite of generative AI tools within the Notion workspace. It helps users write, summarize, brainstorm, and organize information directly inside their documents and databases.',
    website_url: 'https://notion.so/product/ai',
    pricing_model: 'paid',
    pricing_details: '$10 per member/month',
    pricing_tags: ['Subscription'],
    use_case: 'productivity',
    use_cases: ['Smart Notes', 'Knowledge Base', 'Writing Assistant'],
    pros: ['Seamlessly integrated into workspace', 'Powerful summarization features', 'Great for collaborative teams'],
    cons: ['Requires Notion subscription', 'Can be expensive for large teams'],
    has_api: true,
    has_mobile_app: true,
    is_open_source: false
  },
  {
    name: 'Obsidian AI',
    slug: 'obsidian-ai',
    tagline: 'Local-first knowledge base with community-driven AI plugins.',
    description: 'Obsidian is a powerful local-first knowledge base. Through various community plugins like Smart Connections or Text Generator, it allows users to integrate LLMs directly with their local markdown files for advanced reasoning.',
    website_url: 'https://obsidian.md',
    pricing_model: 'free',
    pricing_details: 'Core app is free; sync/publish are paid add-ons',
    pricing_tags: ['Free Tier', 'One-Time'],
    use_case: 'productivity',
    use_cases: ['PKM', 'Local-First Notes', 'Research'],
    pros: ['Total data privacy (local-first)', 'Extremely customizable', 'Huge community plugin ecosystem'],
    cons: ['High learning curve', 'Mobile setup requires more effort'],
    has_api: true,
    has_mobile_app: true,
    is_open_source: false
  },
  {
    name: 'Mem AI',
    slug: 'mem-ai',
    tagline: 'The world\'s first AI-powered self-organizing workspace.',
    description: 'Mem is a note-taking app that uses AI to automatically organize your information. It learns your habits and connects related notes without you needing to use tags or folders.',
    website_url: 'https://mem.ai',
    pricing_model: 'freemium',
    pricing_details: 'Free basic; Plus $8/month',
    pricing_tags: ['Free Tier', 'Subscription'],
    use_case: 'productivity',
    use_cases: ['Self-Organizing Notes', 'Knowledge Retrieval', 'Daily Logging'],
    pros: ['Automatic organization', 'Fast global search', 'Personalized AI assistance'],
    cons: ['Proprietary format', 'Less control over manual structure'],
    has_api: true,
    has_mobile_app: true,
    is_open_source: false
  }
];

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    const productivityCat = (await client.query("SELECT id FROM public.categories WHERE slug = 'productivity'")).rows[0];

    for (const tool of newTools) {
      await client.query(`
        INSERT INTO public.tools (
          name, slug, tagline, description, website_url, 
          pricing_model, pricing_details, pricing_tags, 
          use_case, use_cases, pros, cons, 
          has_api, has_mobile_app, is_open_source, 
          category_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'published')
        ON CONFLICT (slug) DO UPDATE SET
          tagline = EXCLUDED.tagline,
          description = EXCLUDED.description,
          pricing_details = EXCLUDED.pricing_details,
          pricing_tags = EXCLUDED.pricing_tags,
          pros = EXCLUDED.pros,
          cons = EXCLUDED.cons
      `, [
        tool.name, tool.slug, tool.tagline, tool.description, tool.website_url,
        tool.pricing_model, tool.pricing_details, tool.pricing_tags,
        tool.use_case, tool.use_cases, tool.pros, tool.cons,
        tool.has_api, tool.has_mobile_app, tool.is_open_source,
        productivityCat?.id || null
      ]);
      console.log(`Ensured tool exists: ${tool.name}`);
    }

    console.log('\nNote-taking tools added successfully.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
