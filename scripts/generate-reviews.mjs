import pkg from 'pg';
const { Client } = pkg;
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

function loadEnv() {
  const envPath = join(ROOT, '.env.local');
  if (existsSync(envPath)) {
    const raw = readFileSync(envPath, 'utf8');
    const lines = raw.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnv();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres';

const reviewData = [
  {
    toolName: 'ChatGPT',
    rating: 5,
    body: "Honestly, I can't even remember how I used to code before this. It handles all the boilerplate stuff so I can focus on actual logic. The new o1 model is surprisingly good at catching edge cases I would've missed.",
    style: 'Casual developer'
  },
  {
    toolName: 'Midjourney',
    rating: 5,
    body: "The aesthetic quality is just miles ahead of everything else right now. It takes a bit to get used to the Discord interface, but the results are worth it. Perfect for rapid prototyping and mood boarding.",
    style: 'Professional artist'
  },
  {
    toolName: 'Claude',
    rating: 5,
    body: "Claude's writing style feels much more natural and human compared to other models. It actually follows complex instructions without getting 'preachy' or repetitive. I use it for all my long-form content drafting now.",
    style: 'Content creator'
  },
  {
    toolName: 'Perplexity',
    rating: 4,
    body: "Actually replaced Google for 90% of my searches. I love that it cites sources so I can actually verify where the info is coming from. Occasionally it hallucinates a bit on very niche topics, but it's getting better.",
    style: 'Information seeker'
  },
  {
    toolName: 'Cursor',
    rating: 5,
    body: "If you're a dev and not using Cursor yet, you're missing out big time. The way it understands the whole codebase context is just magic. It makes VS Code feel like a legacy tool in comparison.",
    style: 'Hyper-efficient dev'
  },
  {
    toolName: 'Jasper',
    rating: 3,
    body: "It was the best tool a year ago, but it feels a bit overpriced now with so many free alternatives. The templates are still great for marketing teams, but the output sometimes feels a bit generic. Good for volume, maybe not for high-end brand voice.",
    style: 'Critical marketer'
  },
  {
    toolName: 'Descript',
    rating: 4,
    body: "Editing audio by deleting text is a total game changer for my workflow. The 'overdub' feature is spooky good but takes some time to train properly. Still a few bugs here and there, but nothing deal-breaking.",
    style: 'Enthusiastic podcaster'
  },
  {
    toolName: 'Tome',
    rating: 4,
    body: "It's great for quickly throwing together a presentation deck when you're short on time. The AI-generated layouts are usually pretty clean, though the generated text often needs a heavy edit. Way better than starting from a blank PowerPoint slide.",
    style: 'Busy startup founder'
  },
  {
    toolName: 'Obsidian AI',
    rating: 5,
    body: "The way this integrates with my local markdown files is exactly what I needed. It helps me surface connections between my notes that I never would have seen otherwise. It's like having a second brain that actually talks back to you.",
    style: 'Knowledge worker'
  },
  {
    toolName: 'Kling AI',
    rating: 5,
    body: "The video realism here is actually insane, especially with the 1.5 update. It handles physics and light much better than Sora did in those early demos. It's finally getting to the point where AI video is usable for actual creative projects.",
    style: 'Tech-savvy videographer'
  }
];

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log('Starting review generation...');

  try {
    const profilesRes = await client.query('SELECT id, display_name FROM public.profiles LIMIT 20');
    let profiles = profilesRes.rows;

    if (profiles.length === 0) {
      console.error('No profiles found in the database. Please create some users first.');
      return;
    }

    for (let i = 0; i < reviewData.length; i++) {
      const data = reviewData[i];
      
      const toolRes = await client.query('SELECT id FROM public.tools WHERE name ILIKE $1 LIMIT 1', [`%${data.toolName}%`]);
      if (toolRes.rows.length === 0) {
        console.warn(`Tool not found: ${data.toolName}, skipping review.`);
        continue;
      }
      const toolId = toolRes.rows[0].id;

      const profile = profiles[i % profiles.length];
      const userId = profile.id;

      try {
        await client.query(
          `INSERT INTO public.reviews (tool_id, user_id, rating, body, status, is_verified)
           VALUES ($1, $2, $3, $4, 'published', true)
           ON CONFLICT (tool_id, user_id) DO UPDATE SET body = EXCLUDED.body, rating = EXCLUDED.rating`,
          [toolId, userId, data.rating, data.body]
        );
        console.log(`Inserted review for ${data.toolName} by ${profile.display_name} (${data.style})`);
      } catch (err) {
        console.error(`Error inserting review for ${data.toolName}:`, err.message);
      }
    }

    console.log('Review generation complete.');
  } catch (err) {
    console.error('Main error:', err);
  } finally {
    await client.end();
  }
}

main();
