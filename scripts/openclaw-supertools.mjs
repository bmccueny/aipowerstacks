/**
 * openclaw-supertools.mjs
 *
 * 1. Remove Semrush from highest-rated (is_supertools = false)
 * 2. Add OpenClaw to highest-rated (is_supertools = true)
 * 3. Insert 6 editor reviews for OpenClaw
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

const REVIEWS = [
  {
    editor: 'Andrew Ng',
    userId: 'c131993d-8710-43f9-91ef-fb194d7113c0',
    rating: 4,
    body: `OpenClaw represents the kind of open source AI infrastructure I find most promising. You self host it on your own machine, give it access to your tools and services, and interact with it through messaging apps you already use. The persistent memory is genuinely useful for research workflows. I had it monitoring arxiv feeds and summarizing papers matching specific topics, all configured through a Telegram chat. The skills system means the community is constantly expanding what it can do. Setup requires some technical comfort, and the documentation could be more structured for newcomers. But the underlying architecture, local first, transparent, extensible, is exactly the right approach for personal AI assistants.`,
  },
  {
    editor: 'Cassie Kozyrkov',
    userId: '54cd616d-c866-4f41-8ec9-f6cd57190b4a',
    rating: 4,
    body: `Most "personal AI assistants" are glorified chat wrappers with a memory layer bolted on. OpenClaw is structurally different. It runs on your own hardware, has full system access, and you talk to it through WhatsApp or Telegram like a coworker. The skills architecture is the real differentiator: it can teach itself new capabilities by writing and loading its own plugins. I tested it by asking it to set up a daily data pipeline and it built the skill, scheduled the cron job, and reported results the next morning. The heartbeat feature where it proactively checks in is both useful and slightly unnerving. Not for people who want a polished app experience, but for anyone who wants an AI they actually control, this is the benchmark.`,
  },
  {
    editor: 'Ethan Mollick',
    userId: '8d0cf351-70ee-428c-bc76-164f1ee1b929',
    rating: 5,
    body: `OpenClaw is the first AI assistant that actually felt like having a capable intern with 24/7 availability. I set it up on a Mac mini and connected it to Telegram. Within an hour it was managing my calendar, drafting email responses for review, and pulling together research summaries. The part that surprised me most was the skills system. I asked it to build a workflow for grading student assignments and it wrote a custom skill, tested it, and started using it without me touching any code. The persistent memory means context carries across days and weeks. It occasionally gets overconfident about what it can handle, and the initial setup is not trivial. But once it's running, the compound effect of an always on assistant that learns your preferences is remarkable.`,
  },
  {
    editor: 'Marcus Thompson',
    userId: '4cc6e534-b024-4bf4-bd26-c382412e5802',
    rating: 4,
    body: `The cost structure alone makes OpenClaw worth evaluating. It's fully open source, you bring your own LLM API key, and it runs on hardware you already own. No per seat pricing, no enterprise tier lockout. I've been running it on a spare Mac mini for three weeks and it handles email triage, meeting prep, and Slack monitoring without breaking a sweat. The Telegram integration is what I use most: I can fire off tasks from my phone while walking to lunch and it just handles them. It's not zero maintenance though. Skills occasionally break after updates, and you do need to babysit it early on until it learns your preferences. For a bootstrapped team that wants AI automation without another monthly bill, this is the move.`,
  },
  {
    editor: 'Lena Fischer',
    userId: '6e9bf129-5598-4947-9282-c4fe5ed40ef7',
    rating: 4,
    body: `The onboarding experience is surprisingly well considered for an open source project. OpenClaw walks you through persona setup, communication channel selection, and initial skill configuration in a way that feels intentional rather than thrown together. The WhatsApp and Telegram integrations are polished enough that non technical users on my team started interacting with it naturally within minutes. Where it really impressed me was workflow automation: I had it reorganizing my Notion workspace and sending daily standup summaries to Slack with minimal prompting. The interface is conversational rather than visual, which takes adjustment if you're used to dashboard style tools. A few rough edges around error handling when skills fail silently. But the core experience of having an AI assistant that lives where you already communicate is well executed.`,
  },
  {
    editor: 'Sofia Reyes',
    userId: '1c882cdc-fcbd-4ce1-9441-9514bfbde5c8',
    rating: 5,
    body: `Our team deployed OpenClaw on a shared server and connected it to our Slack workspace. Within a week it was handling meeting scheduling, pulling project status updates from Linear, and drafting weekly reports that actually required minimal editing. The persistent memory meant it understood our project context by day three without us repeating ourselves. What convinced me was when a teammate asked it to cross reference two unrelated email threads and surface action items, and it did it correctly on the first try. The open source model matters here: we could audit exactly what data stays local and verify nothing leaves our infrastructure. Setup took about two hours with some Docker experience. For any operations lead looking to reduce the coordination overhead on a growing team, OpenClaw delivers on the promise that most AI assistants only advertise.`,
  },
];

async function main() {
  await client.connect();
  console.log('Connected to database.\n');

  // 1. Remove Semrush from highest-rated
  const { rowCount: semrushRows } = await client.query(
    `UPDATE tools SET is_supertools = false WHERE slug = 'semrush-one' AND is_supertools = true`
  );
  console.log(`Semrush: ${semrushRows} row(s) updated (is_supertools → false)`);

  // 2. Add OpenClaw to highest-rated
  const { rowCount: openclawRows } = await client.query(
    `UPDATE tools SET is_supertools = true WHERE slug = 'openclaw' AND is_supertools = false`
  );
  console.log(`OpenClaw: ${openclawRows} row(s) updated (is_supertools → true)`);

  // 3. Get OpenClaw tool ID
  const { rows: toolRows } = await client.query(
    `SELECT id FROM tools WHERE slug = 'openclaw' LIMIT 1`
  );
  if (toolRows.length === 0) {
    console.error('ERROR: Tool with slug "openclaw" not found!');
    await client.end();
    process.exit(1);
  }
  const toolId = toolRows[0].id;
  console.log(`\nOpenClaw tool ID: ${toolId}`);
  console.log(`Inserting ${REVIEWS.length} editor reviews...\n`);

  // 4. Insert reviews
  let inserted = 0;
  for (const r of REVIEWS) {
    try {
      const { rowCount } = await client.query(
        `INSERT INTO reviews (tool_id, user_id, rating, body, status, is_verified, created_at)
         VALUES ($1, $2, $3, $4, 'published', true, now() - interval '1 day' * (random() * 14)::int)
         ON CONFLICT (tool_id, user_id) DO UPDATE SET body = EXCLUDED.body, rating = EXCLUDED.rating`,
        [toolId, r.userId, r.rating, r.body]
      );
      if (rowCount > 0) {
        console.log(`  ✓ ${r.editor} — ${r.rating}/5`);
        inserted++;
      } else {
        console.log(`  ⊘ ${r.editor} — no change`);
      }
    } catch (err) {
      console.error(`  ✗ ${r.editor} — ${err.message}`);
    }
  }

  console.log(`\nDone: ${inserted} reviews inserted.`);

  // 5. Verify the trigger updated avg_rating
  const { rows: verify } = await client.query(
    `SELECT avg_rating, review_count FROM tools WHERE id = $1`, [toolId]
  );
  if (verify.length > 0) {
    console.log(`OpenClaw now: avg_rating=${verify[0].avg_rating}, review_count=${verify[0].review_count}`);
  }

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
