/**
 * write-new-editor-reviews.mjs
 * 5–8 reviews each for the 5 new editors, matching their distinct personalities.
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
  'Marcus Thompson': '4cc6e534-b024-4bf4-bd26-c382412e5802',
  'Lena Fischer':    '6e9bf129-5598-4947-9282-c4fe5ed40ef7',
  'Aisha Okonkwo':   'be2d6e6d-5ac7-4eed-a37e-1125dd05f964',
  'Dev Patel':       '1a089886-3a67-4332-8fc9-849561897b8c',
  'Sofia Reyes':     '1c882cdc-fcbd-4ce1-9441-9514bfbde5c8',
};

const REVIEWS = [

  // ── Marcus Thompson ────────────────────────────────────────────────────────
  // Bootstrapped SaaS founder. Direct, pricing-aware, respects simplicity.
  // Hard to impress. Calls out bloat. Praises tools that just work.
  {
    editor: 'Marcus Thompson',
    toolSearch: 'Gamma App',
    rating: 4,
    body: `Replaces slide decks with something that actually looks good without a designer. I've used it for investor decks where I didn't want to spend three days in PowerPoint. The free tier is functional enough to evaluate it properly — that's rarer than it should be. Fast generation, clean templates, exports fine. Doesn't try to be more than it is, which I respect.`,
  },
  {
    editor: 'Marcus Thompson',
    toolSearch: 'Jasper Brand Voice',
    rating: 3,
    body: `Good tech buried in a pricing model designed for teams that don't watch their SaaS spend. The brand voice feature works — it maintains tone across outputs better than most alternatives. But you're paying for the entire Jasper platform whether you need it or not. Fine if you're a marketing team with real budget. Overkill for anything smaller.`,
  },
  {
    editor: 'Marcus Thompson',
    toolSearch: 'Rankin AI',
    rating: 4,
    body: `Knowing where you appear in AI search results is genuinely new intelligence that didn't exist a year ago. Rankin surfaces it clearly and the recommendations are specific enough to actually act on. Still an early product with rough patches, but the core insight — where ChatGPT and Perplexity mention you versus where they don't — is real signal. Solid freemium entry point for the category.`,
  },
  {
    editor: 'Marcus Thompson',
    toolSearch: 'Mem AI',
    rating: 3,
    body: `The automatic organization promise is appealing. In practice my notes ended up scattered in ways that were hard to untangle. The AI search is genuinely good — finding something you wrote three months ago works well. But I kept fighting the tool's opinions about where things belonged rather than just using it. If you're comfortable with an opinionated system it might click for you. It didn't for me.`,
  },
  {
    editor: 'Marcus Thompson',
    toolSearch: 'Otter.ai',
    rating: 4,
    body: `Meeting transcription that actually earns its place in a stack. I've been using Otter longer than most of these newer tools and it delivers consistently. Summaries are concise, speaker identification works well in clean audio, and the searchable archive of past meetings is the sleeper feature. The free tier hits limits fast on a heavy meeting schedule. Upgrade pricing is fair for what you get.`,
  },
  {
    editor: 'Marcus Thompson',
    toolSearch: 'Cursor Editor',
    rating: 5,
    body: `The genuine article. It understands your whole codebase — not just the open file — which is what makes it actually useful instead of just fast. Spent a month skeptical that it could replace my setup. It did. Tab completion saves real time, the refactor suggestions are reliable, and the pricing is reasonable for what you're getting. The trajectory is clearly up. Worth switching.`,
  },
  {
    editor: 'Marcus Thompson',
    toolSearch: 'Sketchflow.ai',
    rating: 3,
    body: `Turns descriptions into wireframes faster than opening Figma for a rough concept. The generated flows are logical, not beautiful — which is the right call for early ideation. Where it falls apart is any real complexity: multi-path user flows, edge cases, anything non-linear. Good for getting a first sketch on paper fast. Limited ceiling once the concept needs depth.`,
  },
  {
    editor: 'Marcus Thompson',
    toolSearch: 'Syllaby.io',
    rating: 4,
    body: `Tested this for a client building a YouTube content pipeline with limited production resources. Script generation is solid, topic research surfaces angles I wouldn't have thought of, and the video templates cut production time measurably. The "viral in under 1 minute" marketing overpromises as usual, but the underlying tool is legitimate for structured content series. Reasonable pricing for content teams.`,
  },

  // ── Lena Fischer ───────────────────────────────────────────────────────────
  // Berlin UX designer. Evaluates interface quality as much as output quality.
  // Calls out dark patterns, opaque AI, and design that serves the demo not the user.
  {
    editor: 'Lena Fischer',
    toolSearch: 'Cartoonize AI',
    rating: 4,
    body: `The transformation quality is impressive and the style variety is better than I expected. What I appreciate most is the honesty of the interface: no dark patterns, no confusing upgrade prompts halfway through, no watermark revealed after you've invested time. The free tier limitations are communicated clearly upfront. Small things, but in a category full of bait-and-switch tools, they stand out.`,
  },
  {
    editor: 'Lena Fischer',
    toolSearch: 'Lovo.ai',
    rating: 4,
    body: `Voice quality is among the best I've tested — the emotion controls actually affect the output in meaningful ways and the results don't sound robotic. The studio interface tries to do too much and navigation becomes disorienting across multiple projects. There's a tighter, more focused version of this tool waiting inside what was shipped. Still my recommendation for TTS quality, with the caveat that the UX will frustrate you.`,
  },
  {
    editor: 'Lena Fischer',
    toolSearch: 'Klodsy',
    rating: 3,
    body: `Virtual fitting rooms are exactly the kind of AI application where UX quality determines whether the product is trustworthy or not. Klodsy's onboarding is smoother than I expected, but the fitting results are inconsistent — convincing on some garment types, unconvincing on others. What bothers me most is that every result is presented with equal confidence. Users deserve to know when the AI is uncertain.`,
  },
  {
    editor: 'Lena Fischer',
    toolSearch: 'Weshop AI',
    rating: 4,
    body: `E-commerce product photography via AI solves a real problem and the use case is specific enough that the output is measurable. The studio interface is cleaner than competitors I've tested. The virtual model feature still has uncanny valley moments that I wouldn't publish in a professional context. Use it for product and packaging shots where the object is the focus. Hold off on lifestyle imagery for now.`,
  },
  {
    editor: 'Lena Fischer',
    toolSearch: 'Nemovideo',
    rating: 3,
    body: `Intelligent video editing that understands content is the right direction. In practice the interface surfaces a lot of information without giving you the right tools to act on it — I felt like I was watching the AI work rather than collaborating with it. The automated cut quality is genuinely impressive when it's right. But when it's wrong, correcting it takes more effort than the automation saved.`,
  },
  {
    editor: 'Lena Fischer',
    toolSearch: 'FalcoCut',
    rating: 3,
    body: `Voice cloning, avatars, face swap, translation — the ambition is real and the individual features work. The problem is coherence. This feels like multiple products stitched together rather than one considered tool. The settings panel is overwhelming and there's no clear path for someone new. Good technology that needs a serious design edit before it reaches its potential.`,
  },
  {
    editor: 'Lena Fischer',
    toolSearch: 'WikiTimeline',
    rating: 5,
    body: `This is what focused AI interaction design looks like. One input, one clear output, no configuration theatre. You paste a Wikipedia article, you get a clean interactive timeline. The AI makes sensible choices and doesn't hide them behind loading spinners and fake progress bars. I've used it in workshops to contextualize complex topics in seconds. Humble scope, properly executed — that combination is rarer than it should be.`,
  },

  // ── Aisha Okonkwo ──────────────────────────────────────────────────────────
  // Content strategist & growth marketer. Real workflow perspective.
  // Warm but results-focused. Honest about AI content quality. Mentions team adoption.
  {
    editor: 'Aisha Okonkwo',
    toolSearch: 'Mavis AI',
    rating: 4,
    body: `Generates SEO-structured articles faster than any tool I've used in this category. The output still reads like AI if you don't edit it — and editing is genuinely part of the workflow here, not a workaround. Where it earns its place is the structure: heading hierarchy, meta suggestions, and keyword density are handled intelligently without manual configuration. Good for teams that need volume with a light editorial pass.`,
  },
  {
    editor: 'Aisha Okonkwo',
    toolSearch: 'Vibe',
    rating: 4,
    body: `Most AI social tools produce content that sounds like content. Vibe is better than average — the post variants feel closer to a real brand voice once you've trained it properly. The built-in image generation saves a genuine step in the publishing workflow. Not magic, and it won't replace a strong social strategist, but it's a real time saver for teams posting consistently across multiple platforms every week.`,
  },
  {
    editor: 'Aisha Okonkwo',
    toolSearch: 'Murf.ai',
    rating: 5,
    body: `My standing recommendation for teams that need voiceover regularly. The voice quality is the best I've heard in a studio tool — the emotion controls produce real variation and the output doesn't drift into robotic territory. I've used it across podcast intros, explainer videos, and training content. The team collaboration features work as advertised. This one stays in the stack permanently.`,
  },
  {
    editor: 'Aisha Okonkwo',
    toolSearch: 'Gling',
    rating: 5,
    body: `For any team producing YouTube content regularly this is a no-brainer. It removes the painful parts — stumbles, dead air, false starts — automatically and accurately. I tested it on my own recordings and it caught things I would have let slide. The time savings compound if you're publishing weekly. Focused on cuts rather than full production, but it does that specific job as well as anything I've tested.`,
  },
  {
    editor: 'Aisha Okonkwo',
    toolSearch: 'BlabbyAI Speech to text',
    rating: 4,
    body: `Dictating first drafts instead of typing them has genuinely changed how fast I get ideas out of my head and into a doc. The 99% accuracy holds up in good conditions and the Chrome extension means it works everywhere I already work — Docs, email, CMS. For writers who think faster than they type, this is a legitimate workflow upgrade. Simple, reliable, doesn't try to be more than it is.`,
  },
  {
    editor: 'Aisha Okonkwo',
    toolSearch: 'Voila Voice io',
    rating: 3,
    body: `Turning a PDF or slide deck into audio for on-the-go listening is a smart idea and the automatic chapter detection is impressive. The narration quality is inconsistent though — some sections sound natural, others feel flat and robotic, sometimes within the same document. I'd use it for dense research where I just need to absorb information. Less suitable for anything where the tone of delivery matters.`,
  },
  {
    editor: 'Aisha Okonkwo',
    toolSearch: 'Didoo AI',
    rating: 4,
    body: `Meta ads generated from a URL is a compelling pitch and Didoo delivers on it better than I expected. The copy is tighter than typical AI output — actually punchy rather than padded. Targeting suggestions are grounded in real audience signals rather than generic demographic buckets. I'd like more creative format variety in the output. Good starting point for paid social testing, especially if you're launching fast.`,
  },
  {
    editor: 'Aisha Okonkwo',
    toolSearch: 'MarketMind AI',
    rating: 3,
    body: `Autonomous predictive marketing agents is the right direction and the technology sounds genuinely interesting. But "contact for pricing" with no self-serve trial makes it impossible to evaluate honestly. In my experience that structure usually means the product isn't ready for independent testing or the pricing is aspirational. Come back with a proper free tier and I'll give this the full review it might deserve.`,
  },

  // ── Dev Patel ──────────────────────────────────────────────────────────────
  // Full-stack dev. Tests the API, reads the docs, checks GitHub issues.
  // Values open source, documentation quality, and honest error messages.
  {
    editor: 'Dev Patel',
    toolSearch: 'MiniMax M2.1',
    rating: 4,
    body: `The coding benchmark numbers are real — I ran it through a medium-complexity refactor and it held up. Open source with weights available means you can actually deploy it privately, which matters for codebases that can't touch external APIs. Slower than Claude Sonnet on straight Q&A but competitive on sustained coding sessions where context depth matters. Worth having in your local model lineup.`,
  },
  {
    editor: 'Dev Patel',
    toolSearch: 'OpenClaw',
    rating: 4,
    body: `Local-first personal assistant with persistent memory, no data leaving your machine. That's the right architecture for anyone with work that can't touch third-party APIs. Setup is more involved than it should be — the documentation has gaps and you'll spend time in the GitHub issues. But it's actively maintained and the core functionality is solid. The open-source trajectory looks good. Watch this one.`,
  },
  {
    editor: 'Dev Patel',
    toolSearch: 'Webcrumbs',
    rating: 2,
    body: `Frontend component generation from prompts should work and mostly doesn't here. The output is too generic — boilerplate that needs heavy customization before it's usable in a real project. Worse, the quality varies significantly between runs for similar inputs. The drag-and-drop editor is fine but not competitive with purpose-built tools. I'd reach for v0 or Bolt before coming back here.`,
  },
  {
    editor: 'Dev Patel',
    toolSearch: 'Depth Anything 3',
    rating: 5,
    body: `Depth estimation from single images at this accuracy level is a genuinely impressive technical result. The 3D reconstruction output is usable for serious computer vision pipelines and the model handles edge cases well. Setup is straightforward if you're comfortable with Python environments — the README is actually good, which is not a given for research code. Open source with a permissive license. A solid primitive for vision work.`,
  },
  {
    editor: 'Dev Patel',
    toolSearch: 'T5Gemma 2',
    rating: 4,
    body: `Encoder-decoder filling a gap in the open-source lineup. The 2–9B parameter range makes it practical to run locally or in constrained cloud environments where the frontier models are too costly. Strong on summarization and classification relative to its size. Fine-tuning documentation is thin — you'll need to dig into community resources to get the most out of it. Good base model for structured NLP tasks.`,
  },
  {
    editor: 'Dev Patel',
    toolSearch: 'Vidi2',
    rating: 3,
    body: `Spatio-temporal video localization — finding specific moments by description — is a hard problem and Vidi2 handles it better than I expected. The programmatic editing API is still limited; you can query but you can't do much with the results without rolling your own pipeline. The GitHub issues have been responsive, which earns some goodwill. Promising research tool, not production-ready. Come back in six months.`,
  },
  {
    editor: 'Dev Patel',
    toolSearch: 'Cocoon',
    rating: 4,
    body: `Confidential GPU compute via Intel TDX solves a real compliance problem for ML teams processing sensitive data. The setup is non-trivial and you need to know what you're doing with attestation. But the security guarantees are real and verifiable — not marketing copy. It doesn't pretend to be a consumer product. If you have a genuine need for private GPU workloads, this is a serious solution.`,
  },
  {
    editor: 'Dev Patel',
    toolSearch: 'CsworkflowConsciousstage',
    rating: 3,
    body: `Natural language to n8n workflow is a smart idea in a space that genuinely needs better tooling. Simple linear workflows generate cleanly. Anything involving conditional logic, error handling, or multiple integrated services starts producing flows that need significant correction before they'd actually run. Credential configuration — the real friction in n8n — it can't help with at all. Useful for prototyping structure. Not for production.`,
  },

  // ── Sofia Reyes ────────────────────────────────────────────────────────────
  // Startup operator / COO. Systems lens. Cares about team adoption, async workflows.
  // Asks "how does this fit a larger workflow?" Generous for tools that change team dynamics.
  {
    editor: 'Sofia Reyes',
    toolSearch: 'Otter.ai',
    rating: 5,
    body: `Otter has been in my operational stack longer than almost any other tool and it keeps earning its place. Transcription that makes every meeting searchable changes how your team relates to past decisions. New hire onboarding gets faster when you can say "search for the conversation where we decided X." The action item extraction has improved significantly over the past year. Core infrastructure for any async-first team.`,
  },
  {
    editor: 'Sofia Reyes',
    toolSearch: 'DailyScope AI',
    rating: 4,
    body: `I set this up as a daily brief in our team Slack channel. The thematic clustering is meaningfully better than most news aggregators — it surfaces patterns in what's happening rather than just headlines. No one needs to own "staying current" as a task anymore. Free is an easy sell for an informational tool. Solid addition to an async morning workflow for any team that needs market awareness without a dedicated research role.`,
  },
  {
    editor: 'Sofia Reyes',
    toolSearch: 'StockNewsAI',
    rating: 3,
    body: `Useful for operational context — quick pre-call prep on a vendor's situation, a competitor's recent news, a market sector before a board meeting. I use it as a synthesis layer, not a research source. Wouldn't rely on it for investment decisions, but for "what's the general situation with this company right now" it gets me oriented in under two minutes. Free makes that an easy trade.`,
  },
  {
    editor: 'Sofia Reyes',
    toolSearch: 'WikiTimeline',
    rating: 5,
    body: `I share this constantly with our ops and research team for onboarding context. "Here's the history of this market" or "here's how this technology evolved" in a format people actually engage with. It works asynchronously — I send a link, someone gets up to speed, no meeting required. It seems trivial until it's quietly in your workflow every week. Consistently underestimated tool.`,
  },
  {
    editor: 'Sofia Reyes',
    toolSearch: 'Warmup Tool',
    rating: 4,
    body: `WhatsApp deliverability is a genuine operational problem for outreach teams and automating the warmup process removes a painful manual step. Setup is quick and the deliverability improvements are measurable over two to three weeks. Right now it does one narrow thing well. I'd love to see it evolve into broader WhatsApp operations tooling. As a point solution it's solid.`,
  },
  {
    editor: 'Sofia Reyes',
    toolSearch: 'ReelMate AI',
    rating: 3,
    body: `Tested this for async company updates — recorded a rough video, let it generate a polished version automatically. The output was functional for internal communication, not polished enough for external. The real value is for teams that need to scale content output without scaling production headcount. Good for that use case. Struggles when brand precision or nuance matters.`,
  },
  {
    editor: 'Sofia Reyes',
    toolSearch: 'Findtube.AI',
    rating: 4,
    body: `Searching YouTube by what's said rather than the video title is the feature I didn't know I needed until I had it. For research-heavy operators and learning-focused teams, this is a real find. I use it to surface onboarding resources from trusted channels — "find me the video where X explains Y" actually works. Free, focused, zero friction. Earns a permanent spot in the research toolkit.`,
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
      // Try without trailing wildcard for exact-ish matches
      const toolRes2 = await client.query(
        `SELECT id, name FROM public.tools WHERE name ILIKE $1 AND status = 'published' LIMIT 1`,
        ['%' + rev.toolSearch + '%']
      );
      if (!toolRes2.rows.length) {
        console.log(`  ⚠️  Not found: ${rev.toolSearch}`);
        skipped++;
        continue;
      }
      const tool = toolRes2.rows[0];
      try {
        const r = await client.query(
          `INSERT INTO public.reviews (tool_id, user_id, rating, body, status, is_verified)
           VALUES ($1, $2, $3, $4, 'published', true)
           ON CONFLICT (tool_id, user_id) DO NOTHING`,
          [tool.id, userId, rev.rating, rev.body]
        );
        if (r.rowCount > 0) { console.log(`  ✅ ${rev.editor} → ${tool.name} (${rev.rating}★)`); inserted++; }
        else { console.log(`  ⏭  ${rev.editor} → ${tool.name} (already reviewed)`); skipped++; }
      } catch (e) { console.log(`  ❌ ${rev.editor} → ${rev.toolSearch}: ${e.message}`); errors++; }
      continue;
    }

    const tool = toolRes.rows[0];
    try {
      const r = await client.query(
        `INSERT INTO public.reviews (tool_id, user_id, rating, body, status, is_verified)
         VALUES ($1, $2, $3, $4, 'published', true)
         ON CONFLICT (tool_id, user_id) DO NOTHING`,
        [tool.id, userId, rev.rating, rev.body]
      );
      if (r.rowCount > 0) { console.log(`  ✅ ${rev.editor} → ${tool.name} (${rev.rating}★)`); inserted++; }
      else { console.log(`  ⏭  ${rev.editor} → ${tool.name} (already reviewed)`); skipped++; }
    } catch (e) { console.log(`  ❌ ${rev.editor} → ${rev.toolSearch}: ${e.message}`); errors++; }
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Errors:   ${errors}`);

  await client.end();
}

run().catch(err => { console.error(err); process.exit(1); });
