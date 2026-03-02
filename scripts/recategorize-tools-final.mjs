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

const categoryConfig = {
  'finance': {
    keywords: ['finance', 'accounting', 'stock', 'investment', 'money', 'crypto', 'wallet', 'tax', 'trading', 'dividend', 'revenue', 'expense', 'deduction', 'cpai'],
    boost: ['finance', 'accounting', 'taxes']
  },
  'presentations': {
    keywords: ['presentation', 'slides', 'deck', 'powerpoint', 'keynote', 'gamma', 'storytelling', 'pitch'],
    boost: ['presentations', 'pitch decks']
  },
  'ecommerce': {
    keywords: ['ecommerce', 'shopping', 'store', 'shopify', 'retail', 'product listing', 'customer experience', 'checkout', 'amazon fba'],
    boost: ['ecommerce', 'online store']
  },
  'automation': {
    keywords: ['automation', 'workflow', 'zapier', 'n8n', 'agent', 'browser operator', 'auto-pilot', 'scheduled', 'bulk messaging'],
    boost: ['automation', 'workflow automation']
  },
  'customer-support': {
    keywords: ['support', 'customer service', 'helpdesk', 'ticketing', 'chatbot', 'operator', 'on-call'],
    boost: ['customer support', 'customer service']
  },
  'seo': {
    keywords: ['seo', 'ranking', 'keywords', 'backlinks', 'search engine', 'serp', 'semrush', 'ahrefs'],
    boost: ['seo', 'search engine optimization']
  },
  '3d-animation': {
    keywords: ['3d', 'animation', 'modeling', 'rendering', 'blender', 'unity', 'unreal engine', '4d objects'],
    boost: ['3d generators', '3d modeling']
  },
  'coding': {
    keywords: ['code', 'developer', 'software', 'programming', 'debugging', 'github', 'api', 'app building', 'terminal', 'cli', 'python', 'javascript', 'rust', 'typescript', 'sql', 'database', 'coding agent'],
    boost: ['coding', 'developer tools']
  },
  'healthcare': {
    keywords: ['healthcare', 'medical', 'doctor', 'patient', 'health', 'clinical', 'diagnosis', 'hospital', 'medical speech', 'medasr'],
    boost: ['healthcare', 'medical']
  },
  'data-analytics': {
    keywords: ['data', 'analytics', 'statistics', 'charts', 'visualization', 'insights', 'metrics', 'tracking'],
    boost: ['data & analytics', 'analytics']
  },
  'legal': {
    keywords: ['legal', 'compliance', 'law', 'contract', 'regulation', 'attorney', 'paralegal', 'governance'],
    boost: ['legal', 'law']
  }
};

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    const catRes = await client.query('SELECT id, name, slug FROM public.categories');
    const categories = catRes.rows;

    const toolRes = await client.query(`
      SELECT id, name, tagline, description, use_case, use_cases, category_id
      FROM public.tools
    `);
    const tools = toolRes.rows;

    console.log(`Deep cleaning ${tools.length} tools...`);

    let updatedCount = 0;

    for (const tool of tools) {
      const content = `${tool.name} ${tool.tagline} ${tool.description} ${tool.use_case}`.toLowerCase();
      const useCasesArray = (tool.use_cases || []).map(u => u.toLowerCase());
      
      let bestMatch = null;
      let maxScore = -1;

      for (const [slug, config] of Object.entries(categoryConfig)) {
        let score = 0;
        
        for (const kw of config.keywords) {
          if (content.includes(kw.toLowerCase())) score += 1;
        }
        
        for (const b of config.boost) {
          if (useCasesArray.includes(b.toLowerCase())) score += 5;
        }

        if (score > maxScore) {
          maxScore = score;
          bestMatch = categories.find(c => c.slug === slug);
        }
      }

      if (bestMatch && bestMatch.id !== tool.category_id && maxScore >= 2) {
        await client.query('UPDATE public.tools SET category_id = $1 WHERE id = $2', [bestMatch.id, tool.id]);
        updatedCount++;
      }
    }

    console.log(`\nFinal deep clean complete. ${updatedCount} tools moved to specific categories.`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
