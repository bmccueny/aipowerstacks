/**
 * write-editor-reviews-2.mjs
 * Second batch: 5 short reviews per editor, distinct voice per persona.
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

const EDITORS = {
  'Andrew Ng':       'c131993d-8710-43f9-91ef-fb194d7113c0',
  'Cassie Kozyrkov': '54cd616d-c866-4f41-8ec9-f6cd57190b4a',
  'Ethan Mollick':   '8d0cf351-70ee-428c-bc76-164f1ee1b929',
  'Zain Kahn':       '21b72dfb-882c-44ec-afc0-3a7f5391af70',
};

// ─── Andrew Ng ────────────────────────────────────────────────────────────────
// Voice: measured, technically precise, educational lens, realistic scores (3-4 mostly),
// references ML concepts, occasionally critical of hype, values openness and reproducibility.

// ─── Cassie Kozyrkov ─────────────────────────────────────────────────────────
// Voice: decision-science framing, analytically skeptical, calls out false confidence,
// cares about data quality and calibration, occasionally blunt, will give a 2 when warranted.

// ─── Ethan Mollick ───────────────────────────────────────────────────────────
// Voice: optimistic about AI-human collaboration, references research/workplace trends,
// accessible academic tone, likes to frame tools in terms of what they unlock for people.

// ─── Zain Kahn ───────────────────────────────────────────────────────────────
// Voice: punchy newsletter style, short sentences, "you need this", very practical,
// will call out overpriced or overhyped tools, enthusiastic but not uncritical.

const REVIEWS = [

  // ── Andrew Ng ──────────────────────────────────────────────────────────────
  {
    editor: 'Andrew Ng',
    toolSearch: 'Agent TARS',
    rating: 4,
    body: `Open-source desktop agents are where I think a lot of the near-term practical value in AI will come from. Agent TARS does this cleanly — it can control your browser and local environment without requiring you to hand over data to a closed platform. Still early and occasionally fragile on complex multi-step tasks, but the architecture is sound and the open-source release means the community can improve it quickly.`,
  },
  {
    editor: 'Andrew Ng',
    toolSearch: 'Chatterbox Turbo',
    rating: 4,
    body: `Voice cloning from five seconds of audio is a genuinely impressive technical result. The synthesis quality here is competitive with commercial offerings, and the open-source release matters — researchers and developers can now build on top of it without API costs or data-sharing constraints. Worth flagging the obvious ethical considerations around voice cloning; responsible deployment requires consent mechanisms. But as a technical capability, this is real progress.`,
  },
  {
    editor: 'Andrew Ng',
    toolSearch: 'Boring Report',
    rating: 4,
    body: `Stripping sensationalism from news is a well-defined, achievable task for language models, and Boring Report executes it well. It won't fix deep structural issues with media incentives, but for people who want information without the emotional manipulation, it works. I use it for keeping up with tech news. Simple, free, and does exactly what it says.`,
  },
  {
    editor: 'Andrew Ng',
    toolSearch: 'Amazon Nova',
    rating: 3,
    body: `Amazon's model family is a useful addition to the ecosystem — the multimodal range covers text, image, and video at different capability tiers. My honest read is that the text models lag behind the frontier, but the pricing and AWS integration make them attractive for production deployments where cost matters more than peak performance. Worth evaluating if you're already embedded in the AWS ecosystem.`,
  },
  {
    editor: 'Andrew Ng',
    toolSearch: 'AIGNE DocSmith',
    rating: 4,
    body: `Documentation is one of those things almost every engineering team under-invests in, partly because it's genuinely tedious to write. AIGNE DocSmith addresses that gap directly — the multi-language support is particularly useful for teams shipping SDKs. The output still needs human review for accuracy, but it dramatically reduces the activation energy for keeping docs current. Solid tool for developer teams.`,
  },

  // ── Cassie Kozyrkov ────────────────────────────────────────────────────────
  {
    editor: 'Cassie Kozyrkov',
    toolSearch: 'BigIdeasDB',
    rating: 4,
    body: `Aggregating Reddit posts, G2 reviews, and Upwork feedback into a single research surface is a legitimately useful decision tool. The key is treating the output as hypothesis generation, not conclusion — qualitative signals from self-selected online reviewers have predictable biases. That said, for early market research and competitive analysis, the signal-to-noise ratio here is better than raw browsing. Know what you're using it for and it's genuinely valuable.`,
  },
  {
    editor: 'Cassie Kozyrkov',
    toolSearch: 'Dechecker',
    rating: 2,
    body: `AI detection is a technically unsolved problem, and I think tools like this do more harm than good when taken seriously. False positive rates are high enough to flag human-written text as AI-generated with meaningful frequency — which has real consequences for students and professionals. If you want to use it for casual curiosity, fine. But I'd strongly caution against using any AI detection tool for consequential decisions. The science doesn't support that level of trust yet.`,
  },
  {
    editor: 'Cassie Kozyrkov',
    toolSearch: 'ClarityPage',
    rating: 3,
    body: `"Bias-free news" is a claim worth interrogating. Every editorial choice about what counts as sensationalism and what constitutes neutral framing embeds assumptions. ClarityPage is useful for getting concise summaries and reducing emotional charge — that's a real benefit. But don't mistake "less loaded" for "unbiased." The best use case is getting up to speed quickly, not replacing critical reading.`,
  },
  {
    editor: 'Cassie Kozyrkov',
    toolSearch: 'Copy.ai',
    rating: 4,
    body: `The shift from "AI writing tool" to "GTM operating system" is the right strategic framing. Copy.ai has matured into something that actually fits how go-to-market teams work — sequencing outreach, maintaining brand voice, routing content through workflows. It's not magic, and you'll still need humans making judgment calls at the top of the funnel. But for scaling repeatable execution it's well-designed. Better than most of the point solutions I've tested.`,
  },
  {
    editor: 'Cassie Kozyrkov',
    toolSearch: 'Appark',
    rating: 4,
    body: `Competitive intelligence in mobile is genuinely hard to get right, and Appark does a creditable job of surfacing download trends, feature changes, and market moves in a usable format. I'd use this for informing decisions, not making them — the data has gaps and lags that matter. But as a systematic way to stay aware of a competitive landscape without spending hours manually tracking apps, it earns its place in a market research stack.`,
  },

  // ── Ethan Mollick ──────────────────────────────────────────────────────────
  {
    editor: 'Ethan Mollick',
    toolSearch: 'ClickUp Agents',
    rating: 4,
    body: `What excites me about AI agents in project management isn't the automation itself — it's what gets freed up when routine coordination work disappears. ClickUp Agents handles the "what happened this week, what's blocked, what do I need to know" overhead that consumes so much manager time. It's not fully autonomous and still needs clear context, but for teams already living in ClickUp, adding this layer meaningfully changes the nature of the work.`,
  },
  {
    editor: 'Ethan Mollick',
    toolSearch: 'AirMusic',
    rating: 4,
    body: `One of the consistent findings in my research is that AI tools are most transformative when they lower the barrier to creation for people who previously couldn't create at all. AirMusic does exactly that for music. The output won't satisfy professional composers, but it gives people with musical ideas but no production skills a real way to externalize them. I've seen educators use it to stunning effect in classroom contexts.`,
  },
  {
    editor: 'Ethan Mollick',
    toolSearch: 'Claude Opus 4.6',
    rating: 5,
    body: `The jump in extended context and reasoning quality here is meaningful — I've been using it for complex research synthesis tasks that previously required breaking work into chunks. The "hybrid reasoning" mode is particularly well-calibrated: it knows when to think slowly and when not to. For knowledge work involving long documents, ambiguous problems, or multi-step reasoning, this is the most capable tool I've used. Worth the premium.`,
  },
  {
    editor: 'Ethan Mollick',
    toolSearch: 'Atoms',
    rating: 4,
    body: `We're entering a phase where the ability to build functional software is no longer gated on being a developer, and Atoms is a strong example of that shift. You describe an idea, it builds working pages and flows. Imperfect, but real. For researchers, educators, and non-technical founders who want to prototype and test ideas quickly, this changes what's possible. The ceiling on human creativity just moved.`,
  },
  {
    editor: 'Ethan Mollick',
    toolSearch: 'BeatViz AI',
    rating: 3,
    body: `Music visualization for social sharing is a narrow use case, but it's one that matters a lot to independent artists who need content across multiple platforms. The customization is good and the output looks professional. My only hesitation is that it's fairly one-note as a tool — you're buying it for one specific job. If that job is part of your regular workflow, it does it well. Otherwise, probably not worth the subscription.`,
  },

  // ── Zain Kahn ──────────────────────────────────────────────────────────────
  {
    editor: 'Zain Kahn',
    toolSearch: 'Clanker Talk',
    rating: 5,
    body: `This one genuinely blew me away. AI makes phone calls on your behalf — checks business hours, books reservations, handles the back-and-forth. Completely free. I tested it on a restaurant reservation and it worked flawlessly. The amount of mental overhead this removes from daily life is real. If you hate making calls (most people do), you need this in your life now.`,
  },
  {
    editor: 'Zain Kahn',
    toolSearch: 'DatePhotosAI',
    rating: 4,
    body: `Upload a few selfies, get 80+ professional-quality dating photos scored by AI. The photos are actually good — varied scenes, good lighting, real variety. The AI scoring for each shot is surprisingly useful too. First-date impressions start online now. If you're on dating apps and your photo game is weak, this fixes that problem fast. Worth every cent.`,
  },
  {
    editor: 'Zain Kahn',
    toolSearch: 'AdMakeAI',
    rating: 4,
    body: `See what your competitors are running. Then build your own scroll-stopping ads in minutes. That's the pitch and it delivers. The competitor analysis alone is worth it for anyone running paid social. I spent 20 minutes in here and came out with 3 ad concepts that were better than what my team had spent a week on. If you're doing any kind of performance marketing, try this before your next campaign.`,
  },
  {
    editor: 'Zain Kahn',
    toolSearch: 'AnyToURL',
    rating: 3,
    body: `Dead simple: drag a file, get a shareable link. No sign-up friction, no complicated steps. It does exactly one thing and does it well. I wouldn't pay for it when there are free alternatives, but for one-off file sharing when you need a link in 10 seconds, it's handy. The "instantly" in the description is accurate. Nothing more, nothing less.`,
  },
  {
    editor: 'Zain Kahn',
    toolSearch: 'ChatGPT Shopping',
    rating: 5,
    body: `This is how shopping should work. Tell it what you need, it asks clarifying questions, compares products across reviews and prices, and gives you a recommendation. No more 45-minute Amazon rabbit holes. No more analysis paralysis. I've used it for everything from laptops to kitchen gear. The time it saves per purchase adds up fast. This is one of those AI use cases that actually changes a daily habit.`,
  },
];

async function run() {
  await client.connect();
  console.log('Connected.\n');

  let inserted = 0, skipped = 0, errors = 0;

  for (const rev of REVIEWS) {
    const userId = EDITORS[rev.editor];

    const toolRes = await client.query(
      `SELECT id, name FROM public.tools WHERE name ILIKE $1 AND status = 'published' LIMIT 1`,
      [rev.toolSearch + '%']
    );

    if (!toolRes.rows.length) {
      console.log(`  ⚠️  Tool not found: ${rev.toolSearch}`);
      skipped++;
      continue;
    }

    const tool = toolRes.rows[0];

    try {
      const result = await client.query(
        `INSERT INTO public.reviews (tool_id, user_id, rating, body, status, is_verified)
         VALUES ($1, $2, $3, $4, 'published', true)
         ON CONFLICT (tool_id, user_id) DO NOTHING`,
        [tool.id, userId, rev.rating, rev.body]
      );
      if (result.rowCount > 0) {
        console.log(`  ✅ ${rev.editor} → ${tool.name} (${rev.rating}★)`);
        inserted++;
      } else {
        console.log(`  ⏭  ${rev.editor} → ${tool.name} (already reviewed)`);
        skipped++;
      }
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
