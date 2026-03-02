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

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    // 1. Add columns
    console.log('Adding pros and cons columns...');
    await client.query(`
      ALTER TABLE public.tools 
      ADD COLUMN IF NOT EXISTS pros text[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS cons text[] DEFAULT '{}'
    `);

    // 2. Fetch all tools to parse
    const res = await client.query("SELECT * FROM public.tools");
    const tools = res.rows;
    console.log(`Analyzing ${tools.length} tools for pros/cons...`);

    for (const tool of tools) {
      const toolPros = [];
      const toolCons = [];
      const desc = (tool.description || '').toLowerCase();
      const tagline = (tool.tagline || '').toLowerCase();
      const content = `${tagline} ${desc}`;

      // --- LOGIC BASED PROS ---
      if (tool.is_open_source) toolPros.push('Open-source and community-driven.');
      if (tool.has_api) toolPros.push('Developer-friendly with API access.');
      if (tool.has_mobile_app) toolPros.push('Native mobile app available for on-the-go use.');
      if (tool.trains_on_data === false) toolPros.push('Privacy-focused: Does not train models on user data.');
      if (tool.has_sso) toolPros.push('Enterprise-grade security with SSO support.');
      
      // Keyword parsing for Pros
      if (content.includes('real-time') || content.includes('instant')) toolPros.push('Supports real-time processing or generation.');
      if (content.includes('multilingual') || content.includes('languages')) toolPros.push('Broad multilingual support.');
      if (content.includes('realistic') || content.includes('high-quality') || content.includes('4k')) toolPros.push('Focus on high-fidelity, realistic outputs.');
      if (content.includes('easy to use') || content.includes('simple interface') || content.includes('no-code')) toolPros.push('User-friendly interface requiring minimal technical skill.');
      if (content.includes('integrated') || content.includes('integrates with')) toolPros.push('Strong ecosystem integration capabilities.');
      if (content.includes('autonomous') || content.includes('agent')) toolPros.push('Capable of autonomous agentic workflows.');

      // --- LOGIC BASED CONS ---
      if (tool.pricing_model === 'paid' && !content.includes('free trial')) toolCons.push('No permanent free tier available.');
      if (content.includes('discord')) toolCons.push('Interface is restricted to Discord, which may not suit all workflows.');
      if (content.includes('waitlist')) toolCons.push('Currently has a waitlist or limited access.');
      if (tool.trains_on_data === true) toolCons.push('May use submitted data for model training (check privacy policy).');
      if (!tool.has_api && tool.category_id && tool.category_id !== 'image-generation') toolCons.push('Lack of API access limits automation potential.');
      
      // Categorical Cons
      if (tool.pricing_details && tool.pricing_details.includes('Custom')) toolCons.push('Pricing is opaque and requires sales contact.');

      // Limit to top 4 of each
      const finalPros = [...new Set(toolPros)].slice(0, 4);
      const finalCons = [...new Set(toolCons)].slice(0, 4);

      if (finalPros.length > 0 || finalCons.length > 0) {
        await client.query(
          "UPDATE public.tools SET pros = $1, cons = $2 WHERE id = $3",
          [finalPros, finalCons, tool.id]
        );
      }
    }

    console.log('\nPros and Cons parsing complete.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
