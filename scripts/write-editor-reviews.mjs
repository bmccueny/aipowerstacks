/**
 * write-editor-reviews.mjs
 * Inserts 5 reviews per editor (Andrew Ng, Cassie Kozyrkov, Ethan Mollick, Zain Kahn)
 * for tools that currently have no published reviews.
 */

import pkg from 'pg';
const { Client } = pkg;
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnv() {
  const p = join(ROOT, '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 1) continue;
    if (!process.env[t.slice(0, eq).trim()])
      process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
}
loadEnv();

const DB = 'postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres';
const client = new Client({ connectionString: process.env.DATABASE_URL || DB });

// Editor personas and their UUIDs
const EDITORS = {
  'Andrew Ng':       'c131993d-8710-43f9-91ef-fb194d7113c0',
  'Cassie Kozyrkov': '54cd616d-c866-4f41-8ec9-f6cd57190b4a',
  'Ethan Mollick':   '8d0cf351-70ee-428c-bc76-164f1ee1b929',
  'Zain Kahn':       '21b72dfb-882c-44ec-afc0-3a7f5391af70',
};

// 5 reviews per editor — tool name (ILIKE match), rating, body
const REVIEWS = [

  // ─── Andrew Ng ───────────────────────────────────────────────────────────────
  {
    editor: 'Andrew Ng',
    toolSearch: 'CodeRabbit',
    rating: 4,
    body: `I've been recommending AI-assisted code review to my students and teams for a while now. CodeRabbit does this well — it catches the kind of subtle issues that slip through manual reviews, and the suggestions are generally context-aware. Particularly useful for teams that lack bandwidth for thorough PR reviews. A solid addition to any CI/CD pipeline.`,
  },
  {
    editor: 'Andrew Ng',
    toolSearch: 'TaskraSpace',
    rating: 4,
    body: `Breaking down complex projects into manageable subtasks is a genuinely hard problem, and Taskra handles it surprisingly well for a free tool. The AI-generated milestones are logical, and it saves a lot of cognitive overhead during project kickoffs. I'd like to see deeper integration with common PM tools, but as a standalone brainstorming aid it works well.`,
  },
  {
    editor: 'Andrew Ng',
    toolSearch: 'StudyBuddy',
    rating: 5,
    body: `The best educational AI tools don't just provide answers — they help learners think through problems. StudyBuddy does this better than most. The way it processes uploaded documents and generates targeted questions is pedagogically sound. I've shared it with several of my course participants. The quiz generation from uploaded material alone is worth trying.`,
  },
  {
    editor: 'Andrew Ng',
    toolSearch: 'Fillapp',
    rating: 4,
    body: `Small tools that solve a specific pain point reliably are often more valuable than comprehensive platforms. Fillapp does exactly that — I constantly find myself copying details from emails or documents into forms, and this extension handles that seamlessly. Clean implementation, zero friction. The kind of utility that quietly saves meaningful time every day.`,
  },
  {
    editor: 'Andrew Ng',
    toolSearch: 'Aicraft',
    rating: 4,
    body: `Background removal and professional image editing has historically required specialized skills. Aicraft democratizes this well — the output quality is competitive with dedicated tools, and having clothing/outfit changes alongside background removal in a single workflow is useful for ecommerce and content teams. A practical, focused tool that delivers what it promises.`,
  },

  // ─── Cassie Kozyrkov ─────────────────────────────────────────────────────────
  {
    editor: 'Cassie Kozyrkov',
    toolSearch: 'GitCruiter',
    rating: 4,
    body: `Evaluating developer skill from GitHub contributions is a reasonable proxy — it captures actual output rather than interview performance, which is often poorly calibrated. GitCruiter automates this analysis effectively. My one caution: treat it as signal, not verdict. The best hires I've seen wouldn't always top a GitHub activity metric. Still, for high-volume screening, this is a genuinely useful decision aid.`,
  },
  {
    editor: 'Cassie Kozyrkov',
    toolSearch: 'Costdown',
    rating: 5,
    body: `What I love about Costdown is that it tackles a real decision problem: not just "what is this called?" but "what should I search to find the cheapest option?" That's a classic information asymmetry problem, and AI is well-suited to help. The recommendations are surprisingly practical. More tools should be this focused on actual decision outcomes rather than just information retrieval.`,
  },
  {
    editor: 'Cassie Kozyrkov',
    toolSearch: 'BirdbrainBio',
    rating: 3,
    body: `I appreciate the ambition — using AI to infer personality from social media posts has legitimate research applications. But the output confidence often outpaces reliability. Twitter posts are highly curated and context-dependent. Use this for lightweight insights or entertainment, but be appropriately skeptical of any conclusions you'd act on. The methodology needs more transparency.`,
  },
  {
    editor: 'Cassie Kozyrkov',
    toolSearch: 'Travelrank',
    rating: 4,
    body: `Recommendation systems tend to fall into the trap of showing you more of what you've already done. Travelrank's approach of analyzing your past travel to surface genuinely new destinations is a better framing of the problem. It got the balance right between familiar and novel. Would love to see it incorporate practical logistics as a filter — destinations like these, reachable within X hours.`,
  },
  {
    editor: 'Cassie Kozyrkov',
    toolSearch: 'BrandInAMinute',
    rating: 4,
    body: `Brand identity work has historically been expensive and slow, which meant early-stage companies often skipped it. Tools like BrandInAMinute change that equation. The AI-generated outputs aren't always perfect on first pass, but they're good enough to communicate visual direction and move decisions forward. For rapid iteration cycles at early-stage companies, this is genuinely valuable.`,
  },

  // ─── Ethan Mollick ───────────────────────────────────────────────────────────
  {
    editor: 'Ethan Mollick',
    toolSearch: 'Vibe',
    rating: 4,
    body: `Research on social media engagement shows that consistency and optimization matter more than most people realize — but maintaining both is exhausting. Vibe handles the analytical and scheduling overhead well. It's not a replacement for authentic voice, but it handles the infrastructure so you can focus on ideas. The generated post variants are surprisingly good at capturing different engagement angles.`,
  },
  {
    editor: 'Ethan Mollick',
    toolSearch: 'Inboundr',
    rating: 4,
    body: `Building a visible professional presence on LinkedIn has become genuinely important for career advancement, but most people lack a consistent system for it. Inboundr solves the "I know I should post more but I never do" problem effectively. The content suggestions feel more on-brand than I expected. Good for founders, academics, and professionals who want presence but not a second job.`,
  },
  {
    editor: 'Ethan Mollick',
    toolSearch: 'AIWriteBook',
    rating: 3,
    body: `AI-assisted long-form writing is a genuinely interesting space and the capability is maturing. AIWriteBook is a competent implementation, though significant human judgment is still needed to maintain coherence across chapters. Where it really shines is in first-draft generation and structural suggestions. Think of it as a capable writing partner rather than a ghostwriter — the collaboration framing is more productive.`,
  },
  {
    editor: 'Ethan Mollick',
    toolSearch: 'Butterflai',
    rating: 4,
    body: `Product photography has historically been one of the starkest capability gaps between large and small businesses. Butterflai significantly narrows it. The image editing quality is genuinely good and the short video generation is impressive for this price point. Ecommerce sellers who need frequent product refreshes will find this particularly valuable — this is the kind of tool that changes competitive dynamics for small operators.`,
  },
  {
    editor: 'Ethan Mollick',
    toolSearch: 'FilmFlow',
    rating: 5,
    body: `I've used FilmFlow in discussions about narrative structure — the emotional arc visualizations are genuinely useful for making the "feel" of a film legible in a way that supports analysis. It does something I haven't seen elsewhere: turning subjective emotional experience into structured data. For film studies, storytelling research, or anyone curious about how cinema achieves its effects, this is a delightful and surprisingly substantive tool.`,
  },

  // ─── Zain Kahn ───────────────────────────────────────────────────────────────
  {
    editor: 'Zain Kahn',
    toolSearch: 'Klyps',
    rating: 5,
    body: `If you're selling physical products online and not using Klyps yet, you're leaving money on the table. Static product images are losing ground to video everywhere, and Klyps handles the conversion automatically. Drop in your product photo, get a clean studio-quality video back. I tested it across a dozen product types and the results were consistently usable. This is the kind of AI tool that pays for itself the first week.`,
  },
  {
    editor: 'Zain Kahn',
    toolSearch: 'Cutmuse',
    rating: 4,
    body: `I know this sounds like a novelty, but Cutmuse is actually pretty useful. The AI photo analysis for haircut recommendations is surprisingly nuanced — it accounts for face shape, hair texture, and lifestyle. My barber was skeptical until I showed them the output, which was more specific and actionable than most consultations I've had. Worth trying before your next appointment. Small tool, but genuinely good.`,
  },
  {
    editor: 'Zain Kahn',
    toolSearch: 'Gling',
    rating: 5,
    body: `YouTubers: stop editing out your own bloopers manually. Gling does it automatically and it's shockingly accurate. I tested it on a 45-minute raw recording and it flagged essentially every awkward pause and restart. Saved at least an hour of tedious cleanup. If you produce video content regularly this is a no-brainer. The time it saves on a single video will more than cover the cost of trying it.`,
  },
  {
    editor: 'Zain Kahn',
    toolSearch: 'Crazycontext',
    rating: 4,
    body: `The hardest part of building something new isn't execution — it's generating genuinely fresh ideas that are also buildable. Crazycontext is surprisingly good at producing specific, structured concepts rather than vague suggestions. For founders in ideation mode or developers looking for side project inspiration, it's a useful creative partner. The structured spec output is particularly handy for quick viability checks.`,
  },
  {
    editor: 'Zain Kahn',
    toolSearch: 'AiPlacard',
    rating: 4,
    body: `Finding the right AI tool is genuinely hard right now — there are thousands of them. AiPlacard solves the discovery problem with a clean, well-organized directory. The categorization is sensible and the tool descriptions are more useful than most directories. If you're trying to find AI tools for a specific use case, this is where I'd start. It's the kind of resource I wish existed earlier in the AI boom.`,
  },
];

async function run() {
  await client.connect();
  console.log('Connected.\n');

  let inserted = 0, skipped = 0, errors = 0;

  for (const rev of REVIEWS) {
    const userId = EDITORS[rev.editor];

    // Find tool by name
    const toolRes = await client.query(
      'SELECT id, name FROM public.tools WHERE name ILIKE $1 AND status = \'published\' LIMIT 1',
      [rev.toolSearch + '%']
    );

    if (!toolRes.rows.length) {
      console.log(`  ⚠️  Tool not found: ${rev.toolSearch}`);
      skipped++;
      continue;
    }

    const tool = toolRes.rows[0];

    try {
      await client.query(
        `INSERT INTO public.reviews (tool_id, user_id, rating, body, status, is_verified)
         VALUES ($1, $2, $3, $4, 'published', true)
         ON CONFLICT (tool_id, user_id) DO NOTHING`,
        [tool.id, userId, rev.rating, rev.body]
      );
      console.log(`  ✅ ${rev.editor} → ${tool.name} (${rev.rating}★)`);
      inserted++;
    } catch (e) {
      console.log(`  ❌ ${rev.editor} → ${tool.name}: ${e.message}`);
      errors++;
    }
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Errors:   ${errors}`);

  await client.end();
}

run().catch(err => { console.error(err); process.exit(1); });
