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

const categoryKeywords = {
  'image-generation': ['image', 'photo', 'art', 'generation', 'midjourney', 'dalle', 'stable diffusion', 'design', 'visual'],
  'video': ['video', 'animation', 'movie', 'film', 'motion', 'avatar', 'dubbing'],
  'coding': ['code', 'developer', 'software', 'programming', 'debugging', 'github', 'api', 'app building'],
  'business': ['business', 'marketing', 'sales', 'gtm', 'strategy', 'entrepreneur', 'startup'],
  'ai-chat': ['chat', 'assistant', 'chatbot', 'conversational', 'dialogue', 'llm', 'gpt'],
  'audio': ['audio', 'music', 'sound', 'voiceover', 'speech', 'text-to-speech', 'tts', 'podcast'],
  'automation': ['automation', 'workflow', 'zapier', 'n8n', 'integrated', 'sync'],
  'productivity': ['productivity', 'notes', 'tasks', 'management', 'workflow', 'organize', 'calendar'],
  'education': ['education', 'learning', 'student', 'teacher', 'school', 'homework', 'tutoring'],
  'writing': ['writing', 'content', 'copywriting', 'blog', 'article', 'seo', 'text'],
  'news': ['news', 'rss', 'newspaper', 'briefing', 'current events', 'headlines'],
  'research': ['research', 'analysis', 'data', 'scientific', 'papers', 'summarization'],
  'healthcare': ['healthcare', 'medical', 'doctor', 'patient', 'health', 'clinical'],
  'finance': ['finance', 'accounting', 'stock', 'investment', 'money', 'crypto', 'wallet'],
  'legal': ['legal', 'compliance', 'law', 'contract', 'regulation'],
  'real-estate': ['real estate', 'property', 'house', 'apartment', 'listing'],
  'travel': ['travel', 'navigation', 'trip', 'flight', 'hotel', 'map'],
  'fitness': ['fitness', 'workout', 'gym', 'training', 'exercise', 'diet', 'nutrition'],
  'food': ['food', 'recipe', 'cooking', 'meal', 'restaurant'],
  'sports-gaming': ['sports', 'gaming', 'game', 'roblox', 'esports', 'match'],
  'ecommerce': ['ecommerce', 'shopping', 'store', 'shopify', 'retail'],
  'hr': ['hr', 'recruitment', 'hiring', 'resume', 'job', 'interview'],
  'data-analytics': ['data', 'analytics', 'statistics', 'charts', 'visualization', 'insights'],
  'customer-support': ['support', 'customer service', 'helpdesk', 'ticketing'],
  'dating-social': ['dating', 'social', 'friends', 'matchmaking', 'relationship'],
  'email': ['email', 'inbox', 'newsletter', 'outreach'],
  'translation': ['translation', 'translate', 'languages', 'multilingual'],
  'summarization': ['summarization', 'summarize', 'summary', 'extract'],
  'avatars': ['avatar', 'persona', 'face swap', 'deepfake'],
  'design': ['design', 'ui', 'ux', 'prototyping', 'figma', 'canva'],
  'presentations': ['presentation', 'slides', 'deck', 'powerpoint', 'keynote', 'gamma'],
  'seo': ['seo', 'ranking', 'keywords', 'backlinks', 'search engine'],
  '3d-animation': ['3d', 'animation', 'modeling', 'rendering', 'blender', 'unity'],
  'search': ['search', 'engine', 'discovery', 'find', 'perplexity'],
  'social-media': ['social media', 'tiktok', 'instagram', 'twitter', 'linkedin', 'viral']
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
      const content = `${tool.name} ${tool.tagline} ${tool.description} ${tool.use_case} ${tool.use_cases ? tool.use_cases.join(' ') : ''}`.toLowerCase();
      
      let bestMatch = null;
      let maxMatches = 0;

      for (const [slug, keywords] of Object.entries(categoryKeywords)) {
        let matches = 0;
        for (const kw of keywords) {
          if (content.includes(kw.toLowerCase())) {
            matches++;
          }
        }
        
        if (matches > maxMatches) {
          maxMatches = matches;
          bestMatch = categories.find(c => c.slug === slug);
        }
      }

      if (bestMatch && bestMatch.id !== tool.category_id) {
        // Only update if we have a reasonably strong match (at least 2 keywords or tool name matches)
        if (maxMatches >= 2 || (bestMatch.name.toLowerCase() !== 'productivity' && maxMatches >= 1)) {
          await client.query('UPDATE public.tools SET category_id = $1 WHERE id = $2', [bestMatch.id, tool.id]);
          updatedCount++;
          // console.log(`Moved ${tool.name} to ${bestMatch.name}`);
        }
      }
    }

    console.log(`\nRe-categorization complete. ${updatedCount} tools moved.`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
