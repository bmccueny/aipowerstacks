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
  'coding': {
    keywords: ['code', 'developer', 'software', 'programming', 'debugging', 'github', 'api', 'app building', 'terminal', 'cli', 'python', 'javascript', 'rust', 'typescript', 'sql', 'database'],
    boost: ['coding', 'developer tools']
  },
  'video': {
    keywords: ['video', 'animation', 'movie', 'film', 'motion', 'avatar', 'dubbing', 'sora', 'runway', 'kling', 'pika', 'heygen', 'synthesia'],
    boost: ['video generators', 'video edition']
  },
  'image-generation': {
    keywords: ['image generation', 'generative art', 'midjourney', 'stable diffusion', 'dalle', 'photorealistic', 'txt2img'],
    boost: ['image generators', 'generative art']
  },
  'audio': {
    keywords: ['audio', 'music', 'sound', 'voiceover', 'speech', 'text-to-speech', 'tts', 'podcast', 'elevenlabs', 'murf', 'suno', 'udio'],
    boost: ['audio generators', 'music', 'voice']
  },
  'business': {
    keywords: ['business', 'marketing', 'sales', 'gtm', 'strategy', 'entrepreneur', 'startup', 'market research', 'prospecting', 'lead gen'],
    boost: ['business', 'marketing', 'sales']
  },
  'ai-chat': {
    keywords: ['chat', 'assistant', 'chatbot', 'conversational', 'dialogue', 'llm', 'gpt', 'claude', 'gemini', 'perplexity', 'copilot'],
    boost: ['ai chat', 'assistants']
  },
  'productivity': {
    keywords: ['productivity', 'notes', 'tasks', 'management', 'workflow', 'organize', 'calendar', 'notion', 'obsidian', 'slack', 'teams'],
    boost: ['productivity']
  },
  'education': {
    keywords: ['education', 'learning', 'student', 'teacher', 'school', 'homework', 'tutoring', 'academic', 'study', 'course'],
    boost: ['education', 'learning']
  },
  'writing': {
    keywords: ['writing', 'content', 'copywriting', 'blog', 'article', 'seo', 'text', 'jasper', 'copy.ai', 'writesonic'],
    boost: ['writing', 'copywriting', 'content creation']
  },
  'news': {
    keywords: ['news', 'rss', 'newspaper', 'briefing', 'current events', 'headlines', 'journalism'],
    boost: ['news']
  },
  'research': {
    keywords: ['research', 'analysis', 'scientific', 'papers', 'data analysis', 'knowledge base'],
    boost: ['research']
  },
  'healthcare': {
    keywords: ['healthcare', 'medical', 'doctor', 'patient', 'health', 'clinical', 'diagnosis', 'hospital'],
    boost: ['healthcare', 'medical']
  },
  'finance': {
    keywords: ['finance', 'accounting', 'stock', 'investment', 'money', 'crypto', 'wallet', 'tax', 'trading'],
    boost: ['finance', 'accounting']
  },
  'legal': {
    keywords: ['legal', 'compliance', 'law', 'contract', 'regulation', 'attorney', 'paralegal'],
    boost: ['legal']
  },
  'real-estate': {
    keywords: ['real estate', 'property', 'house', 'apartment', 'listing', 'realtor'],
    boost: ['real estate']
  },
  'travel': {
    keywords: ['travel', 'navigation', 'trip', 'flight', 'hotel', 'map', 'itinerary'],
    boost: ['travel']
  },
  'fitness': {
    keywords: ['fitness', 'workout', 'gym', 'training', 'exercise', 'diet', 'nutrition', 'calories'],
    boost: ['fitness', 'health']
  },
  'ecommerce': {
    keywords: ['ecommerce', 'shopping', 'store', 'shopify', 'retail', 'product listing'],
    boost: ['ecommerce']
  },
  'hr': {
    keywords: ['hr', 'recruitment', 'hiring', 'resume', 'job', 'interview', 'talent'],
    boost: ['hr', 'recruitment']
  },
  'translation': {
    keywords: ['translation', 'translate', 'languages', 'multilingual', 'bilingual'],
    boost: ['translation']
  },
  'summarization': {
    keywords: ['summarization', 'summarize', 'summary', 'extract points'],
    boost: ['summarization']
  },
  'design': {
    keywords: ['design', 'ui', 'ux', 'prototyping', 'figma', 'canva', 'graphics', 'logo', 'layout'],
    boost: ['design', 'ui', 'ux']
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

    console.log(`Analyzing ${tools.length} tools...`);

    let updatedCount = 0;

    for (const tool of tools) {
      const content = `${tool.name} ${tool.tagline} ${tool.description} ${tool.use_case}`.toLowerCase();
      const useCasesArray = (tool.use_cases || []).map(u => u.toLowerCase());
      
      let bestMatch = null;
      let maxScore = -1;

      for (const [slug, config] of Object.entries(categoryConfig)) {
        let score = 0;
        
        // Keyword matches (Score 1 each)
        for (const kw of config.keywords) {
          if (content.includes(kw.toLowerCase())) {
            score += 1;
          }
        }
        
        // Exact boost matches in use_cases (Score 5 each - very strong signal)
        for (const b of config.boost) {
          if (useCasesArray.includes(b.toLowerCase())) {
            score += 5;
          }
        }

        // Boosting exact name matches in content (Score 3)
        if (content.includes(slug.replace('-', ' '))) {
          score += 3;
        }

        if (score > maxScore) {
          maxScore = score;
          bestMatch = categories.find(c => c.slug === slug);
        }
      }

      // Fallback: If no good match, keep current category unless it's Productivity (which is often a catch-all)
      if (bestMatch && bestMatch.id !== tool.category_id) {
        const currentCat = categories.find(c => c.id === tool.category_id);
        
        // Only move if new score is significant (>= 3) OR if it's currently in a generic category
        const currentIsGeneric = currentCat && (currentCat.slug === 'productivity' || currentCat.slug === 'business');
        
        if (maxScore >= 3 || (currentIsGeneric && maxScore >= 1)) {
          await client.query('UPDATE public.tools SET category_id = $1 WHERE id = $2', [bestMatch.id, tool.id]);
          updatedCount++;
        }
      }
    }

    console.log(`\nRefined re-categorization complete. ${updatedCount} tools moved.`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
